import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic, Paperclip, Sparkles, ArrowRight,
  Star as StarIcon, Trash2, Clock, Share2, X, ImageIcon, Plus,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn, formatDate, formatServerError, isNetworkError, consumeNDJSONStream, readImageFile, type AttachedImage } from '../lib/utils';
import { useVoiceInput } from '../lib/useVoiceInput';
import { Dropdown } from '../components/ui/Dropdown';
import { Modal } from '../components/ui/Modal';
import { Star } from '../components/ui/Doodles';

export function Home() {
  const navigate = useNavigate();
  const { projects, createProject, deleteProject, toggleStar, addToast, removeToast, user } = useStore();
  const firstName = user.name.split(' ')[0];
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [phaseLabel, setPhaseLabel] = useState('');
  const [streamedChars, setStreamedChars] = useState(0);
  const [attachedImage, setAttachedImage] = useState<AttachedImage | null>(null);
  const [planning, setPlanning] = useState(false);
  const [planText, setPlanText] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { listening, toggleListening } = useVoiceInput({
    onResult: transcript => setPrompt(p => (p ? `${p} ${transcript}` : transcript)),
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

  const handlePlan = async () => {
    if (!prompt.trim() || planning || generating) return;
    setPlanning(true);

    try {
      const response = await fetch('http://localhost:3000/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), attachment: attachedImage || undefined }),
      });

      const data = await response.json().catch(() => ({} as { plan?: string; error?: string; details?: string }));

      if (!response.ok) {
        throw new Error(formatServerError(response.status, data, 'Não foi possível gerar o plano.'));
      }

      setPlanText(data.plan || '');
    } catch (error) {
      console.error(error);
      addToast({
        type: 'error',
        title: 'Falha ao planejar',
        message: isNetworkError(error)
          ? 'Não foi possível conectar. Verifique se o servidor Express está rodando em http://localhost:3000.'
          : error instanceof Error
            ? error.message
            : 'Erro ao gerar o plano.',
      });
    } finally {
      setPlanning(false);
    }
  };

  const handleGenerate = async (planOverride?: string) => {

    if (!prompt.trim()) return;
    setPlanText(null);
    setGenerating(true);
    setPhaseLabel('Conectando ao servidor...');
    setStreamedChars(0);

    const loadingToastId = addToast({
      type: 'loading',
      title: 'AI is building your project',
      message: 'Connecting to server and generating code...',
    });

    try {
      const response = await fetch('http://localhost:3000/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          attachment: attachedImage || undefined,
          plan: planOverride || undefined,
        }),
      });

      // Erro antes do stream começar (ex.: prompt vazio) ainda vem como JSON normal.
      if (!response.ok) {
        let data: { error?: string; details?: string } = {};
        try {
          data = await response.json();
        } catch {
          data = {};
        }
        throw new Error(formatServerError(response.status, data, 'Erro ao gerar o projeto.'));
      }

      type GenerateResult = {
        code?: string;
        files?: { name: string; content: string }[];
        explanation?: string;
        brokenFiles?: { name: string; error: string }[];
        theme?: import('../types').ProjectTheme;
      };

      let finalResult: GenerateResult | null = null;
      let streamError: { error?: string; details?: string } | null = null;

      await consumeNDJSONStream<
        | { type: 'chunk'; text: string }
        | { type: 'phase'; phase: string; label?: string }
        | { type: 'provider_switch' }
        | { type: 'done'; code: string; files?: { name: string; content: string }[]; explanation?: string; brokenFiles?: { name: string; error: string }[]; theme?: import('../types').ProjectTheme }
        | { type: 'error'; error?: string; details?: string }
      >(response, event => {
        if (event.type === 'chunk') {
          setStreamedChars(c => c + (event.text?.length || 0));
        } else if (event.type === 'phase') {
          setPhaseLabel(event.label || event.phase);
          setStreamedChars(0);
        } else if (event.type === 'provider_switch') {
          setStreamedChars(0);
        } else if (event.type === 'done') {
          finalResult = event;
        } else if (event.type === 'error') {
          streamError = event;
        }
      });

      if (streamError) {
        throw new Error((streamError as any).details || (streamError as any).error || 'Erro ao gerar o projeto.');
      }

      if (!finalResult) {
        throw new Error('O servidor não retornou o projeto gerado.');
      }

      const result = finalResult as GenerateResult;
      const id = createProject(prompt.trim(), 'app', result.files, result.explanation, result.theme);

      if (result.brokenFiles && result.brokenFiles.length > 0) {
        addToast({
          type: 'error',
          title: 'Alguns arquivos ficaram com erro',
          message: `${result.brokenFiles.map(f => f.name).join(', ')} — a IA não conseguiu corrigir automaticamente. Peça no chat pra tentar de novo.`,
        });
      }

      removeToast(loadingToastId);
      setGenerating(false);
      setPhaseLabel('');
      setPrompt('');
      setAttachedImage(null);
      navigate(`/project/${id}`);
    } catch (error) {
      console.error(error);
      removeToast(loadingToastId);
      setGenerating(false);
      setPhaseLabel('');

      const message = isNetworkError(error)
        ? 'Não foi possível conectar. Verifique se o servidor Express está rodando em http://localhost:3000.'
        : error instanceof Error
          ? error.message
          : 'Erro ao gerar o projeto.';

      addToast({
        type: 'error',
        title: 'Falha ao gerar o projeto',
        message,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const starTints = ['text-lavender-ink', 'text-sage-ink', 'text-rose-deep'];
  const recentProjects = projects.slice(0, 8);

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-6 py-6 lg:py-10">
      {/* Saudação */}
      <div className="relative mb-8 animate-fade-in">
        <Star size={18} className="absolute -top-2 right-6 text-lavender/70" rotate={-12} />
        <Star size={11} fill className="absolute top-6 right-20 text-sage-deep/60" rotate={8} />
        <h1 className="font-display text-3xl lg:text-4xl font-semibold text-ink">
          Olá, <span className="doodle-underline-rose">{firstName}</span>!
        </h1>
        <p className="hand text-2xl text-ink/55 mt-1">O que você vai criar hoje?</p>
      </div>

      {/* Caixa de prompt */}
      <div className="washi relative paper-card p-4 mb-10 max-w-3xl animate-slide-up">
        <Star size={14} fill className="absolute top-3 right-3 text-lavender-deep/70" />
        <Star size={9} className="absolute top-5 right-9 text-rose-deep/60" rotate={20} />

        <span className="hand text-lg text-ink/50">Descreva sua ideia...</span>

        {attachedImage && (
          <div className="flex items-center gap-2 mt-2 px-2.5 py-1.5 rounded-lg bg-lavender-soft/50 border border-paper-line2 w-fit max-w-full">
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
          ref={textareaRef}
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ex: um site de cafeteria moderna com tons de roxo e detalhes em creme"
          rows={4}
          className="w-full bg-transparent px-1 py-2 text-ink placeholder:text-ink/40 focus:outline-none resize-none text-[15px]"
        />

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelected} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-lg text-ink/55 hover:text-ink hover:bg-ink/[0.05] transition-all"
              title="Anexar imagem"
            >
              <Paperclip className="w-[18px] h-[18px]" />
            </button>
            <button
              onClick={toggleListening}
              className={cn(
                'p-2 rounded-lg transition-all',
                listening ? 'text-rose-ink bg-rose-soft animate-pulse' : 'text-ink/55 hover:text-ink hover:bg-ink/[0.05]'
              )}
              title={listening ? 'Parar ditado' : 'Ditar por voz'}
            >
              <Mic className="w-[18px] h-[18px]" />
            </button>
            <div className="h-4 w-px bg-paper-line2 mx-1" />
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-sage-soft">
              <div className="w-2 h-2 rounded-full bg-sage-deep" />
              <span className="text-xs text-sage-ink font-medium">IA pronta</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePlan}
              disabled={!prompt.trim() || planning || generating}
              title="Ver o plano (arquitetura + design) antes de gerar"
              className="btn-outline text-sm py-2 px-3 hidden sm:flex items-center gap-1.5 disabled:opacity-40"
            >
              {planning ? (
                <div className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              Ver plano
            </button>
            <button
              onClick={() => handleGenerate()}
              disabled={!prompt.trim() || generating}
              className="btn-primary text-sm py-2 px-4 flex items-center gap-2"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                  {streamedChars > 0
                    ? `Gerando… ${streamedChars.toLocaleString()} caracteres`
                    : phaseLabel || 'Gerando...'}
                </>
              ) : (
                <>
                  Gerar com IA
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        <p className="hand text-base text-ink/40 mt-2">
          aperte ⌘ + Enter pra gerar
        </p>
      </div>

      {/* Projetos recentes */}
      <div>
        <div className="flex items-end justify-between mb-5">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-2xl font-semibold text-ink doodle-underline-sage">Projetos Recentes</h2>
            <Star size={14} fill className="text-sage-deep/70 mb-1" rotate={-10} />
          </div>
          <button
            onClick={() => navigate('/projects')}
            className="text-sm font-display text-lavender-ink hover:text-lavender-deep transition-colors flex items-center gap-1"
          >
            Ver todos <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
          {recentProjects.map((p, i) => (
            <div
              key={p.id}
              onClick={() => navigate(`/project/${p.id}`)}
              className="group flex-shrink-0 w-60 paper-card card-hover cursor-pointer p-4"
            >
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-paper-sunken flex items-center justify-center">
                  <Star size={26} fill className={starTints[i % starTints.length]} rotate={i % 2 ? 6 : -6} />
                </div>
                <div onClick={e => e.stopPropagation()}>
                  <Dropdown
                    items={[
                      { label: 'Abrir', icon: <ArrowRight className="w-3.5 h-3.5" />, onClick: () => navigate(`/project/${p.id}`) },
                      { label: p.starred ? 'Desfavoritar' : 'Favoritar', icon: <StarIcon className="w-3.5 h-3.5" />, onClick: () => toggleStar(p.id) },
                      {
                        label: 'Compartilhar',
                        icon: <Share2 className="w-3.5 h-3.5" />,
                        onClick: () => {
                          const url = `${window.location.origin}/project/${p.id}`;
                          navigator.clipboard
                            .writeText(url)
                            .then(() => addToast({ type: 'success', title: 'Link copiado!', message: url }))
                            .catch(() => addToast({ type: 'error', title: 'Não foi possível copiar o link' }));
                        },
                      },
                      {
                        label: 'Excluir',
                        icon: <Trash2 className="w-3.5 h-3.5" />,
                        danger: true,
                        onClick: () => {
                          if (window.confirm(`Excluir "${p.name}"? Essa ação não pode ser desfeita.`)) {
                            deleteProject(p.id);
                            addToast({ type: 'success', title: 'Projeto excluído' });
                          }
                        },
                      },
                    ]}
                  />
                </div>
              </div>
              <h3 className="font-display font-medium text-ink truncate mt-3">{p.name}</h3>
              <p className="text-xs text-ink/55 truncate mt-0.5">{p.description}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-[10px] font-medium',
                  p.status === 'live' && 'bg-sage-soft text-sage-ink',
                  p.status === 'building' && 'bg-lavender-soft text-lavender-ink',
                  p.status === 'draft' && 'bg-paper-sunken text-ink/60',
                  p.status === 'error' && 'bg-rose-soft text-rose-ink'
                )}>
                  {p.status}
                </span>
                <span className="hand text-sm text-ink/45">editado {formatDate(p.lastModified)}</span>
              </div>
            </div>
          ))}

          <button
            onClick={() => textareaRef.current?.focus()}
            className="flex-shrink-0 w-60 rounded-2xl border-2 border-dashed border-paper-line2 flex flex-col items-center justify-center gap-2 text-ink/45 hover:text-lavender-ink hover:border-lavender-deep/50 transition-all"
          >
            <Plus className="w-6 h-6" />
            <span className="hand text-lg">Novo Projeto</span>
          </button>
        </div>
      </div>

      <Modal open={planText !== null} onClose={() => setPlanText(null)} className="max-w-2xl">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-lavender flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-lavender-ink" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-lg font-semibold text-ink">Plano do projeto</h2>
              <p className="text-sm text-ink/55">Arquitetura e design system que a IA vai seguir na geração</p>
            </div>
          </div>
          <pre className="max-h-[52vh] overflow-y-auto whitespace-pre-wrap break-words text-xs text-ink/75 bg-paper-sunken border border-paper-line2 rounded-xl p-4 leading-relaxed font-mono">
            {planText || '—'}
          </pre>
          <div className="flex items-center justify-end gap-2 mt-4">
            <button onClick={() => setPlanText(null)} className="btn-outline text-sm py-2 px-4">
              Fechar
            </button>
            <button
              onClick={() => handleGenerate(planText || undefined)}
              className="btn-primary text-sm py-2 px-4 flex items-center gap-2"
            >
              Gerar com este plano
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
