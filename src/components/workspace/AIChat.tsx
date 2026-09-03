import { useState, useRef, useEffect } from 'react';
import {
  Send, Paperclip, User as UserIcon, FileCode, Trash, ChevronLeft, Mic, X, Image as ImageIcon,
} from 'lucide-react';
import type { ChatMessage } from '../../types';
import { useStore } from '../../store/useStore';
import { cn, formatDate, formatServerError, isNetworkError, consumeNDJSONStream, readImageFile, type AttachedImage } from '../../lib/utils';
import { useVoiceInput } from '../../lib/useVoiceInput';
import { findNodeByPath } from '../../lib/fileTree';
import { Star } from '../ui/Doodles';

interface Props {
  projectId: string;
  messages: ChatMessage[];
  onCollapse?: () => void;
}

export function AIChat({ projectId, messages, onCollapse }: Props) {
  const {
  addChatMessage,
  addToast,
  createCheckpoint,
  getProject,
  applyGeneratedFile,
  removeGeneratedFile,
} = useStore();
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [streamedChars, setStreamedChars] = useState(0);
  const [attachedImage, setAttachedImage] = useState<AttachedImage | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { listening, toggleListening } = useVoiceInput({
    onResult: transcript => setInput(v => (v ? `${v} ${transcript}` : transcript)),
    onError: message => addToast({ type: 'error', title: 'Ditado por voz', message }),
  });

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const image = await readImageFile(file);
      setAttachedImage(image);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Não foi possível anexar a imagem',
        message: error instanceof Error ? error.message : undefined,
      });
    }
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking, streamedChars]);

  const handleSend = async () => {
  if (!input.trim() || thinking) return;

  const userText = input.trim();
  const project = getProject(projectId);

  if (!project) {
    addToast({
      type: 'error',
      title: 'Projeto não encontrado',
      message: 'Não foi possível encontrar este projeto.',
    });
    return;
  }

  // Mostra a mensagem do usuário imediatamente
  addChatMessage(projectId, {
    role: 'user',
    content: userText,
    status: 'sent',
  });

  setInput('');
  setAttachedImage(null);
  setThinking(true);
  setStreamedChars(0);

  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: userText,

        files: project.files.map(file => ({
          id: file.id,
          name: file.name,
          type: file.type,
          language: file.language,
          content: file.content || '',
          parentId: file.parentId,
        })),

        history: project.chat.slice(-10),

        attachment: attachedImage || undefined,
      }),
    });

    // Erro antes do stream começar (ex.: prompt vazio) ainda vem como JSON normal.
    if (!response.ok) {
      let errBody: { error?: string; details?: string } = {};
      try {
        errBody = await response.json();
      } catch {
        errBody = {};
      }
      throw new Error(formatServerError(response.status, errBody, 'Erro ao conversar com a IA.'));
    }

    let data: {
      message?: string;
      actions?: Array<{
        type?: string;
        file?: string;
        content?: string;
      }>;
      brokenFiles?: { name: string; error: string }[];
    } | null = null;

    let streamError: { error?: string; details?: string } | null = null;

    await consumeNDJSONStream<
      | { type: 'chunk'; text: string }
      | { type: 'provider_switch' }
      | { type: 'done'; message?: string; actions?: any[]; brokenFiles?: { name: string; error: string }[] }
      | { type: 'error'; error?: string; details?: string }
    >(response, event => {
      if (event.type === 'chunk') {
        setStreamedChars(c => c + (event.text?.length || 0));
      } else if (event.type === 'provider_switch') {
        setStreamedChars(0);
      } else if (event.type === 'done') {
        data = event;
      } else if (event.type === 'error') {
        streamError = event;
      }
    });

    if (streamError) {
      throw new Error((streamError as any).details || (streamError as any).error || 'Erro ao conversar com a IA.');
    }

    if (!data) {
      throw new Error('O servidor não retornou uma resposta.');
    }

    const result = data as {
      message?: string;
      actions?: Array<{
        type?: string;
        file?: string;
        content?: string;
      }>;
      brokenFiles?: { name: string; error: string }[];
    };

    const chatActions: NonNullable<ChatMessage['actions']> = [];

    // O servidor só manda os arquivos que de fato mudaram (edição
    // incremental) — cada action vira um upsert por caminho, criando
    // o arquivo (e as pastas que faltarem) se ele ainda não existir.
    if (Array.isArray(result.actions)) {
      for (const action of result.actions) {
        if (action.type === 'update_file') {
          const path = action.file || 'App.tsx';

          if (typeof action.content === 'string') {
            const existed = !!findNodeByPath(getProject(projectId)?.files || [], path);
            applyGeneratedFile(projectId, path, action.content);

            chatActions.push({
              type: existed ? 'edit_file' : 'create_file',
              label: `${existed ? 'Atualizado' : 'Criado'} ${path}`,
              detail: existed ? 'Código atualizado pela IA' : 'Novo arquivo criado pela IA',
            });
          }
        } else if (action.type === 'delete_file') {
          const path = action.file;

          if (path && findNodeByPath(getProject(projectId)?.files || [], path)) {
            removeGeneratedFile(projectId, path);

            chatActions.push({
              type: 'delete_file',
              label: `Excluído ${path}`,
              detail: 'Arquivo removido pela IA',
            });
          }
        }
      }
    }

    /*
     * =====================================================
     * MOSTRA A RESPOSTA DA IA NO CHAT
     * =====================================================
     */

    addChatMessage(projectId, {
      role: 'assistant',
      content: result.message || 'Concluído!',
      status: 'sent',
      actions: chatActions,
    });

    createCheckpoint(
      projectId,
      `AI: ${userText.slice(0, 40)}`
    );

    addToast({
      type: 'success',
      title: 'IA atualizou seu projeto',
      message:
        chatActions.length > 0
          ? 'As alterações foram aplicadas ao projeto.'
          : 'A IA respondeu sem alterar arquivos.',
    });

    if (result.brokenFiles && result.brokenFiles.length > 0) {
      addToast({
        type: 'error',
        title: 'Alguns arquivos ficaram com erro',
        message: `${result.brokenFiles.map(f => f.name).join(', ')} — a IA não conseguiu corrigir automaticamente. Peça pra tentar de novo.`,
      });
    }

  } catch (error) {
    console.error('Erro no AIChat:', error);

    const message = isNetworkError(error)
      ? 'Não foi possível conectar. Verifique se o servidor Express está rodando em http://localhost:3000.'
      : error instanceof Error
        ? error.message
        : 'Não foi possível processar sua solicitação.';

    addChatMessage(projectId, {
      role: 'assistant',
      content: message,
      status: 'error',
    });

    addToast({
      type: 'error',
      title: 'Erro na IA',
      message,
    });

  } finally {
    setThinking(false);
  }
};

  const actionIcons = {
    create_file: FileCode,
    edit_file: FileCode,
    delete_file: Trash,
  };

  return (
    <div className="h-full flex flex-col bg-paper">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-paper-line">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-lavender flex items-center justify-center">
            <Star size={15} fill className="text-lavender-ink" />
          </div>
          <div>
            <span className="font-display text-sm font-semibold text-ink">NEXA AI</span>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-sage-deep" />
              <span className="text-[10px] text-ink/55">online</span>
            </div>
          </div>
        </div>
        {onCollapse && (
          <button
            onClick={onCollapse}
            className="p-1.5 rounded-lg text-ink/55 hover:text-ink hover:bg-ink/[0.05]"
            title="Esconder painel"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={cn('flex gap-2.5', msg.role === 'user' && 'flex-row-reverse')}>
            <div className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
              msg.role === 'user' ? 'bg-sage' : 'bg-lavender'
            )}>
              {msg.role === 'user'
                ? <UserIcon className="w-4 h-4 text-sage-ink" />
                : <Star size={14} fill className="text-lavender-ink" />}
            </div>
            <div className={cn('flex-1 min-w-0 flex flex-col', msg.role === 'user' && 'items-end')}>
              <div className={cn(
                'px-3.5 py-2.5 text-sm rounded-2xl max-w-[92%]',
                msg.role === 'user'
                  ? 'bg-lavender text-lavender-ink rounded-br-md'
                  : msg.status === 'error'
                    ? 'bg-rose-soft text-rose-ink border border-rose-deep/30 rounded-bl-md'
                    : 'bg-paper-card border border-paper-line text-ink/85 rounded-bl-md'
              )}>
                {msg.content}
              </div>
              {msg.actions && msg.actions.length > 0 && (
                <div className="mt-2 space-y-1 w-full">
                  {msg.actions.map((action, i) => {
                    const Icon = actionIcons[action.type];
                    return (
                      <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-paper-sunken border border-paper-line text-xs">
                        <Icon className="w-3 h-3 text-lavender-ink flex-shrink-0" />
                        <span className="text-ink/75 font-medium">{action.label}</span>
                        <span className="text-ink/45 truncate">— {action.detail}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              <span className="hand text-xs text-ink/40 mt-1">{formatDate(msg.timestamp)}</span>
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-lavender flex items-center justify-center flex-shrink-0">
              <Star size={14} fill className="text-lavender-ink" />
            </div>
            <div className="bg-paper-card border border-paper-line rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-lavender-deep animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-lavender-deep animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-lavender-deep animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs text-ink/55">
                {streamedChars > 0 ? `escrevendo… ${streamedChars.toLocaleString()} caracteres` : 'a IA está pensando...'}
              </span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-paper-line">
        <div className="paper-card p-2">
          {attachedImage && (
            <div className="flex items-center gap-2 mb-1.5 px-2 py-1.5 rounded-lg bg-lavender-soft/50 border border-paper-line2 w-fit max-w-full">
              <ImageIcon className="w-3.5 h-3.5 text-lavender-ink flex-shrink-0" />
              <span className="text-xs text-ink/75 truncate">{attachedImage.name}</span>
              <button
                onClick={() => setAttachedImage(null)}
                className="p-0.5 rounded text-ink/55 hover:text-ink hover:bg-ink/10 flex-shrink-0"
                title="Remover anexo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Digite sua mensagem..."
            rows={2}
            className="w-full bg-transparent px-2 py-1 text-sm text-ink placeholder:text-ink/40 focus:outline-none resize-none"
          />
          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelected}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-lg text-ink/55 hover:text-ink hover:bg-ink/[0.05] transition-all"
                title="Anexar imagem"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <button
                onClick={toggleListening}
                className={cn(
                  'p-1.5 rounded-lg transition-all',
                  listening ? 'text-rose-ink bg-rose-soft animate-pulse' : 'text-ink/55 hover:text-ink hover:bg-ink/[0.05]'
                )}
                title={listening ? 'Parar ditado' : 'Ditar por voz'}
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || thinking}
              className="btn-primary p-2 rounded-lg disabled:opacity-40"
              title="Enviar"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
