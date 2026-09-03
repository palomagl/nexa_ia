import { useEffect, useState, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Code2, Eye, MessageSquare, History, PanelLeft, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import { Star } from '../components/ui/Doodles';
import { FileExplorer } from '../components/workspace/FileExplorer';
import { Preview } from '../components/workspace/Preview';
import { AIChat } from '../components/workspace/AIChat';
import { CodeEditor } from '../components/workspace/CodeEditor';
import { VersionsPanel } from '../components/workspace/VersionsPanel';

type ViewMode = 'preview' | 'code';

function PanelToggle({ active, onClick, label, children }: {
  active: boolean; onClick: () => void; label: string; children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-pressed={active}
      className={cn(
        'p-2 rounded-lg transition-colors',
        active ? 'bg-lavender-soft text-lavender-ink' : 'text-ink/55 hover:text-ink hover:bg-ink/[0.05]'
      )}
    >
      {children}
    </button>
  );
}

function EdgeReopen({ side, onClick, title }: { side: 'left' | 'right'; onClick: () => void; title: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'flex-shrink-0 w-7 bg-paper-card text-ink/40 hover:text-lavender-ink hover:bg-lavender-soft/40 flex items-center justify-center transition-colors',
        side === 'left' ? 'border-r border-paper-line' : 'border-l border-paper-line'
      )}
    >
      {side === 'left' ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
    </button>
  );
}

export function ProjectWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getProject } = useStore();
  const project = id ? getProject(id) : undefined;

  const [view, setView] = useState<ViewMode>('preview');
  const [isCompact, setIsCompact] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 1024
  );
  // Chat = coluna esquerda (aberta por padrão em telas largas).
  // Histórico = coluna direita (fechada). Arquivos = gaveta sobreposta (fechada).
  const [showChat, setShowChat] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 1024
  );
  const [showHistory, setShowHistory] = useState(false);
  const [showExplorer, setShowExplorer] = useState(false);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);

  // Seleciona um arquivo real quando o projeto carrega (ou troca).
  useEffect(() => {
    if (!project) return;
    setActiveFileId(prev => {
      if (prev && project.files.some(f => f.id === prev && f.type === 'file')) return prev;
      const app = project.files.find(f => f.type === 'file' && f.name === 'App.tsx');
      const firstFile = project.files.find(f => f.type === 'file');
      return (app || firstFile)?.id ?? null;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const sync = () => {
      const compact = mq.matches;
      setIsCompact(compact);
      if (compact) {
        setShowChat(false);
        setShowHistory(false);
        setShowExplorer(false);
      }
    };
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  if (!project) {
    return (
      <div className="h-screen flex items-center justify-center bg-paper">
        <div className="flex flex-col items-center gap-3 text-center">
          <Star size={40} className="text-paper-line2" rotate={-8} />
          <p className="hand text-xl text-ink/50">projeto não encontrado</p>
          <button onClick={() => navigate('/projects')} className="btn-primary text-sm">Voltar aos projetos</button>
        </div>
      </div>
    );
  }

  const activeFile = project.files.find(f => f.id === activeFileId);

  const selectFile = (fid: string) => {
    setActiveFileId(fid);
    setView('code');
    setShowExplorer(false);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-paper">
      {/* Cabeçalho */}
      <header className="h-14 flex-shrink-0 flex items-center justify-between gap-3 px-3 border-b border-paper-line bg-paper-card">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 flex-shrink-0 rounded-lg hover:bg-ink/[0.05] px-1.5 py-1 transition-colors"
            title="Voltar"
          >
            <div className="w-7 h-7 rounded-lg bg-lavender flex items-center justify-center">
              <Star size={15} fill className="text-lavender-ink" />
            </div>
            <span className="hidden sm:flex items-baseline gap-1 font-display font-semibold text-sm tracking-tight">
              <span className="text-ink">NEXA</span>
              <span className="text-lavender-ink">AI</span>
            </span>
          </button>

          <div className="h-4 w-px bg-paper-line2 flex-shrink-0" />

          <p className="font-display text-sm font-medium text-ink truncate max-w-[140px] sm:max-w-xs">
            {project.name}
          </p>
        </div>

        {/* Preview / Código */}
        <div className="flex items-center p-0.5 rounded-xl bg-paper border border-paper-line2">
          <button
            onClick={() => setView('preview')}
            className={cn(
              'px-3 h-8 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors',
              view === 'preview' ? 'bg-lavender-soft text-lavender-ink' : 'text-ink/55 hover:text-ink'
            )}
          >
            <Eye className="w-3.5 h-3.5" /> Preview
          </button>
          <button
            onClick={() => setView('code')}
            className={cn(
              'px-3 h-8 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors',
              view === 'code' ? 'bg-lavender-soft text-lavender-ink' : 'text-ink/55 hover:text-ink'
            )}
          >
            <Code2 className="w-3.5 h-3.5" /> Código
          </button>
        </div>

        {/* Painéis */}
        <div className="flex items-center gap-1">
          <PanelToggle active={showExplorer} onClick={() => setShowExplorer(v => !v)} label="Arquivos">
            <PanelLeft className="w-4 h-4" />
          </PanelToggle>
          <PanelToggle active={showChat} onClick={() => setShowChat(v => !v)} label="Chat da IA">
            <MessageSquare className="w-4 h-4" />
          </PanelToggle>
          <PanelToggle active={showHistory} onClick={() => setShowHistory(v => !v)} label="Histórico">
            <History className="w-4 h-4" />
          </PanelToggle>
        </div>
      </header>

      {/* Corpo */}
      <div className="flex-1 min-h-0 flex overflow-hidden relative">
        {/* Chat — coluna esquerda, estreita */}
        {showChat && (
          <aside
            className={cn(
              'flex-shrink-0 border-r border-paper-line bg-paper min-h-0',
              isCompact
                ? 'absolute inset-y-0 left-0 z-40 w-[86vw] max-w-[340px] shadow-paper-lg'
                : 'w-[300px] lg:w-[330px]'
            )}
          >
            <AIChat projectId={project.id} messages={project.chat} onCollapse={() => setShowChat(false)} />
          </aside>
        )}
        {!showChat && !isCompact && (
          <EdgeReopen side="left" onClick={() => setShowChat(true)} title="Abrir chat da IA" />
        )}

        {/* Preview / Código — elemento dominante */}
        <section className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
          {view === 'preview' ? (
            <Preview files={project.files} projectName={project.name} theme={project.theme} />
          ) : activeFile ? (
            <CodeEditor
              content={activeFile.content || ''}
              language={activeFile.language}
              filename={activeFile.name}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-2">
              <Star size={36} className="text-paper-line2" rotate={-8} />
              <p className="hand text-lg text-ink/45">abra “Arquivos” e escolha um arquivo</p>
            </div>
          )}
        </section>

        {/* Histórico — coluna direita */}
        {!showHistory && !isCompact && (
          <EdgeReopen side="right" onClick={() => setShowHistory(true)} title="Abrir histórico" />
        )}
        {showHistory && (
          <aside
            className={cn(
              'flex-shrink-0 border-l border-paper-line bg-paper min-h-0 flex flex-col',
              isCompact
                ? 'absolute inset-y-0 right-0 z-40 w-[86vw] max-w-[340px] shadow-paper-lg'
                : 'w-[300px]'
            )}
          >
            <div className="h-11 flex-shrink-0 flex items-center justify-end px-2 border-b border-paper-line">
              <button
                onClick={() => setShowHistory(false)}
                className="p-1.5 rounded-md text-ink/55 hover:text-ink hover:bg-ink/[0.05]"
                title="Esconder histórico"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <VersionsPanel projectId={project.id} versions={project.versions} />
            </div>
          </aside>
        )}

        {/* Arquivos — gaveta sobreposta pela esquerda */}
        {showExplorer && (
          <>
            <button
              type="button"
              aria-label="Fechar Arquivos"
              className="absolute inset-0 z-40 bg-ink/25"
              onClick={() => setShowExplorer(false)}
            />
            <aside className="absolute inset-y-0 left-0 z-50 w-[280px] bg-paper-card border-r border-paper-line2 shadow-paper-lg animate-slide-right flex flex-col">
              <FileExplorer
                projectId={project.id}
                files={project.files}
                activeFileId={activeFileId}
                onSelectFile={selectFile}
                onCollapse={() => setShowExplorer(false)}
              />
            </aside>
          </>
        )}

        {/* Scrim das gavetas de chat/histórico no modo compacto */}
        {isCompact && (showChat || showHistory) && (
          <button
            type="button"
            aria-label="Fechar painel"
            className="absolute inset-0 z-30 bg-ink/25"
            onClick={() => { setShowChat(false); setShowHistory(false); }}
          />
        )}
      </div>
    </div>
  );
}
