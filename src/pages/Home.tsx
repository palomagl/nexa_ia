import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic, Paperclip, Sparkles, ArrowRight, Globe, Layout, BarChart3, Layers,
  Star, Trash2, Clock, Share2, X, ImageIcon,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn, formatDate, formatServerError, isNetworkError, consumeNDJSONStream, readImageFile, type AttachedImage } from '../lib/utils';
import { useVoiceInput } from '../lib/useVoiceInput';
import { Dropdown } from '../components/ui/Dropdown';
import { Modal } from '../components/ui/Modal';
import type { ProjectType } from '../types';

export function Home() {
  const navigate = useNavigate();
  const { projects, createProject, deleteProject, toggleStar, addToast, removeToast } = useStore();
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
      };

      let finalResult: GenerateResult | null = null;
      let streamError: { error?: string; details?: string } | null = null;

      await consumeNDJSONStream<
        | { type: 'chunk'; text: string }
        | { type: 'phase'; phase: string; label?: string }
        | { type: 'provider_switch' }
        | { type: 'done'; code: string; files?: { name: string; content: string }[]; explanation?: string; brokenFiles?: { name: string; error: string }[] }
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
      const id = createProject(prompt.trim(), 'app', result.files, result.explanation);

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

  const quickStarts: { icon: typeof Globe; label: string; desc: string; type: ProjectType; gradient: string }[] = [
    { icon: Globe, label: 'Website', desc: 'Create a beautiful website', type: 'website', gradient: 'from-nexa-600 to-violet-500' },
    { icon: Layout, label: 'App', desc: 'Build a web application', type: 'app', gradient: 'from-violet-600 to-nexa-400' },
    { icon: BarChart3, label: 'Dashboard', desc: 'Create admin dashboards', type: 'dashboard', gradient: 'from-nexa-500 to-violet-600' },
    { icon: Layers, label: 'Prototype', desc: 'Quick interactive prototype', type: 'prototype', gradient: 'from-violet-400 to-nexa-500' },
  ];

  const recentProjects = projects.slice(0, 8);

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
      {/* Hero */}
      <div className="text-center mb-10 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-lavender-soft/70 border border-lavender-deep/30 mb-6">
          <Sparkles className="w-3.5 h-3.5 text-lavender-ink" />
          <span className="text-xs font-medium text-lavender-ink">Powered by NEXA AI</span>
        </div>
        <h1 className="text-3xl lg:text-5xl font-extrabold tracking-tight text-ink mb-3 text-balance">
          What will you <span className="gradient-text">build</span> today?
        </h1>
        <p className="text-ink/60 text-base lg:text-lg">Create websites and apps by chatting with AI.</p>
      </div>

      {/* Prompt Box */}
      <div className="relative max-w-3xl mx-auto mb-8 animate-slide-up">
        <div className="absolute inset-0 gradient-nexa opacity-20 blur-2xl rounded-3xl" />
        <div className="relative glass-strong rounded-2xl p-2 shadow-2xl">
          {attachedImage && (
            <div className="flex items-center gap-2 mx-2 mt-2 px-2.5 py-1.5 rounded-lg bg-ink/[0.05] border border-paper-line2 w-fit max-w-full">
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
            placeholder="Describe what you want to build..."
            rows={4}
            className="w-full bg-transparent px-4 py-3 text-ink placeholder:text-ink/45 focus:outline-none resize-none text-[15px]"
          />
          <div className="flex items-center justify-between px-2 pb-1">
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
                className="p-2 rounded-lg text-ink/55 hover:text-ink hover:bg-ink/[0.05] transition-all"
                title="Anexar imagem"
              >
                <Paperclip className="w-[18px] h-[18px]" />
              </button>
              <button
                onClick={toggleListening}
                className={cn(
                  'p-2 rounded-lg transition-all',
                  listening ? 'text-red-400 bg-red-500/10 animate-pulse' : 'text-ink/55 hover:text-ink hover:bg-ink/[0.05]'
                )}
                title={listening ? 'Parar ditado' : 'Ditar por voz'}
              >
                <Mic className="w-[18px] h-[18px]" />
              </button>
              <div className="h-4 w-px bg-ink/10 mx-1" />
              <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-ink/[0.04]">
                <div className="w-2 h-2 rounded-full bg-green-400 glow-dot" />
                <span className="text-xs text-ink/60">AI Ready</span>
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
                  <div className="w-3.5 h-3.5 border-2 border-ink/25 border-t-white rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                Plan
              </button>
              <button
                onClick={() => handleGenerate()}
                disabled={!prompt.trim() || generating}
                className="btn-primary text-sm py-2 px-4 flex items-center gap-2"
              >
                {generating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-ink/25 border-t-white rounded-full animate-spin" />
                    {streamedChars > 0
                      ? `Generating… ${streamedChars.toLocaleString()} chars`
                      : phaseLabel || 'Generating...'}
                  </>
                ) : (
                  <>
                    Generate
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        <p className="text-center text-xs text-ink/45 mt-3">
          Press <kbd className="px-1.5 py-0.5 rounded bg-ink/[0.05] text-ink/55">⌘</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-ink/[0.05] text-ink/55">Enter</kbd> to generate
        </p>
      </div>

      {/* Quick Start */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-10">
        {quickStarts.map((qs, i) => (
          <button
            key={qs.label}
            onClick={() => {
              setPrompt(`Create a ${qs.label.toLowerCase()}: `);
              textareaRef.current?.focus();
            }}
            className="group relative glass rounded-2xl p-5 text-left card-hover animate-slide-up overflow-hidden"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className={cn('w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3 transition-transform group-hover:scale-110', qs.gradient)}>
              <qs.icon className="w-5 h-5 text-ink" />
            </div>
            <h3 className="font-semibold text-ink mb-0.5">{qs.label}</h3>
            <p className="text-xs text-ink/55">{qs.desc}</p>
            <div className="absolute inset-0 bg-gradient-to-t from-lavender/0 to-lavender/0 group-hover:from-lavender/10 transition-all duration-300 pointer-events-none" />
          </button>
        ))}
      </div>

      {/* Recent Projects */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-ink">Recent Projects</h2>
          <button onClick={() => navigate('/projects')} className="text-sm text-lavender-ink hover:text-lavender-ink transition-colors flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
          {recentProjects.map(p => (
            <div
              key={p.id}
              onClick={() => navigate(`/project/${p.id}`)}
              className="group flex-shrink-0 w-72 glass rounded-2xl overflow-hidden card-hover cursor-pointer"
            >
              <div className={cn('h-36 bg-gradient-to-br relative overflow-hidden', p.previewGradient)}>
                <div className="absolute inset-0 bg-ink/10" />
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="glass-strong rounded-lg p-2.5">
                    <div className="h-1.5 w-3/4 bg-ink/15 rounded mb-1.5" />
                    <div className="h-1.5 w-1/2 bg-ink/10 rounded" />
                  </div>
                </div>
                <div className="absolute top-3 right-3">
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-md',
                    p.status === 'live' && 'bg-green-500/20 text-green-300',
                    p.status === 'building' && 'bg-lavender-soft text-lavender-ink',
                    p.status === 'draft' && 'bg-ink/10 text-ink/70',
                    p.status === 'error' && 'bg-red-500/20 text-red-300'
                  )}>
                    {p.status}
                  </span>
                </div>
                {p.starred && <Star className="absolute top-3 left-3 w-4 h-4 text-amber-400 fill-amber-400" />}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-ink truncate">{p.name}</h3>
                    <p className="text-xs text-ink/55 truncate mt-0.5">{p.description}</p>
                  </div>
                  <Dropdown
                    items={[
                      { label: 'Open', icon: <ArrowRight className="w-3.5 h-3.5" />, onClick: () => navigate(`/project/${p.id}`) },
                      { label: p.starred ? 'Unstar' : 'Star', icon: <Star className="w-3.5 h-3.5" />, onClick: () => toggleStar(p.id) },
                      {
                        label: 'Share',
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
                        label: 'Delete',
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
                <div className="flex items-center gap-3 mt-3 text-xs text-ink/45">
                  <span className="capitalize">{p.type}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(p.lastModified)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal open={planText !== null} onClose={() => setPlanText(null)} className="max-w-2xl">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl gradient-nexa flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-ink" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-ink">Plano do projeto</h2>
              <p className="text-sm text-ink/55">Arquitetura e design system que a IA vai seguir na geração</p>
            </div>
          </div>
          <pre className="max-h-[52vh] overflow-y-auto whitespace-pre-wrap break-words text-xs text-ink/75 bg-ink/[0.03] border border-paper-line rounded-xl p-4 leading-relaxed font-mono">
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
