import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Code2, Eye, MessageSquare, History,
  PanelLeft, Sparkles, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import { FileExplorer } from '../components/workspace/FileExplorer';
import { Preview } from '../components/workspace/Preview';
import { AIChat } from '../components/workspace/AIChat';
import { CodeEditor } from '../components/workspace/CodeEditor';
import { VersionsPanel } from '../components/workspace/VersionsPanel';

type ViewMode = 'preview' | 'code';
type RightView = 'chat' | 'history';

export function ProjectWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getProject } = useStore();

  const project = id ? getProject(id) : undefined;

  const [view, setView] = useState<ViewMode>('preview');
  const [rightView, setRightView] = useState<RightView>('chat');
  const [showExplorer, setShowExplorer] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 1440
  );
  const [showRight, setShowRight] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 1100
  );
  const [isCompact, setIsCompact] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 1024
  );
  const [activeFileId, setActiveFileId] = useState<string | null>(null);

  // Seleciona um arquivo real quando o projeto carrega (ou troca). Antes o
  // padrão era o id 'f2' de um projeto mock — que não existe nos projetos
  // gerados, deixando a aba Code vazia.
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
        setShowExplorer(false);
        setShowRight(false);
      }
    };
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-ink/55 mb-4">Project not found</p>
          <button onClick={() => navigate('/projects')} className="btn-primary">Back to Projects</button>
        </div>
      </div>
    );
  }

  const activeFile = project.files.find(f => f.id === activeFileId);

  const openChat = () => {
    if (showRight && rightView === 'chat') {
      setShowRight(false);
      return;
    }
    setRightView('chat');
    setShowRight(true);
  };

  const openHistory = () => {
    setRightView('history');
    setShowRight(true);
  };

  const explorerPanel = (
    <div className="h-full min-h-0 flex flex-col">
      <FileExplorer
        projectId={project.id}
        files={project.files}
        activeFileId={activeFileId}
        onSelectFile={(fid) => {
          setActiveFileId(fid);
          setView('code');
          if (isCompact) setShowExplorer(false);
        }}
        onCollapse={() => setShowExplorer(false)}
      />
    </div>
  );

  const rightPanel = (
    <div className="h-full min-h-0 flex flex-col">
      {rightView === 'chat' ? (
        <AIChat
          projectId={project.id}
          messages={project.chat}
          onCollapse={() => setShowRight(false)}
        />
      ) : (
        <div className="h-full min-h-0 flex flex-col">
          <div className="h-11 flex-shrink-0 flex items-center justify-end px-2 border-b border-paper-line">
            <button
              onClick={() => setShowRight(false)}
              className="p-1.5 rounded-md text-ink/55 hover:text-ink hover:bg-ink/[0.05]"
              title="Esconder painel"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 min-h-0">
            <VersionsPanel projectId={project.id} versions={project.versions} />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-paper">
      <header className="h-14 flex-shrink-0 flex items-center justify-between gap-3 px-3 border-b border-paper-line bg-paper">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 flex-shrink-0 rounded-lg hover:bg-ink/[0.05] px-1.5 py-1 transition-colors"
            title="Voltar"
          >
            <div className="w-7 h-7 rounded-lg gradient-nexa flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-ink" />
            </div>
            <span className="hidden sm:flex items-baseline gap-1">
              <span className="text-sm font-bold tracking-tight text-ink">NEXA</span>
              <span className="text-sm font-bold tracking-tight gradient-text">AI</span>
            </span>
          </button>

          <div className="h-4 w-px bg-ink/10 flex-shrink-0" />

          <p className="text-sm font-medium text-ink truncate max-w-[220px] sm:max-w-xs">
            {project.name}
          </p>
        </div>

        <div className="flex items-center p-0.5 rounded-lg bg-ink/[0.05]">
          <button
            onClick={() => setView('preview')}
            className={cn(
              'px-3 h-8 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors',
              view === 'preview' ? 'bg-ink/10 text-ink' : 'text-ink/55 hover:text-ink'
            )}
          >
            <Eye className="w-3.5 h-3.5" /> Preview
          </button>
          <button
            onClick={() => setView('code')}
            className={cn(
              'px-3 h-8 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors',
              view === 'code' ? 'bg-ink/10 text-ink' : 'text-ink/55 hover:text-ink'
            )}
          >
            <Code2 className="w-3.5 h-3.5" /> Code
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowExplorer(v => !v)}
            className={cn(
              'p-2 rounded-md transition-colors',
              showExplorer ? 'text-ink bg-ink/10' : 'text-ink/55 hover:text-ink hover:bg-ink/[0.05]'
            )}
            title={showExplorer ? 'Esconder Explorer' : 'Abrir Explorer'}
          >
            <PanelLeft className="w-4 h-4" />
          </button>
          <button
            onClick={openChat}
            className={cn(
              'p-2 rounded-md transition-colors',
              showRight && rightView === 'chat' ? 'text-ink bg-ink/10' : 'text-ink/55 hover:text-ink hover:bg-ink/[0.05]'
            )}
            title={showRight && rightView === 'chat' ? 'Esconder AI Assistant' : 'Abrir AI Assistant'}
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              if (rightView === 'history' && showRight) setShowRight(false);
              else openHistory();
            }}
            className={cn(
              'p-2 rounded-md transition-colors',
              showRight && rightView === 'history' ? 'text-ink bg-ink/10' : 'text-ink/55 hover:text-ink hover:bg-ink/[0.05]'
            )}
            title={showRight && rightView === 'history' ? 'Fechar histórico' : 'Histórico'}
          >
            <History className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex overflow-hidden relative">
        {isCompact && (showExplorer || showRight) && (
          <button
            type="button"
            aria-label="Fechar painel"
            className="absolute inset-0 z-20 bg-ink/25"
            onClick={() => {
              setShowExplorer(false);
              setShowRight(false);
            }}
          />
        )}

        {showExplorer && (
          <aside
            className={cn(
              'flex-shrink-0 border-r border-paper-line bg-paper min-h-0',
              isCompact
                ? 'absolute inset-y-0 left-0 z-30 w-[240px] shadow-2xl'
                : 'w-[240px]'
            )}
          >
            {explorerPanel}
          </aside>
        )}

        {!showExplorer && !isCompact && (
          <button
            onClick={() => setShowExplorer(true)}
            className="flex-shrink-0 w-8 border-r border-paper-line text-ink/45 hover:text-ink hover:bg-ink/[0.04] flex items-center justify-center"
            title="Abrir Explorer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        <section className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-hidden">
            {view === 'preview' ? (
              <Preview
                files={project.files}
                projectName={project.name}
              />
            ) : activeFile ? (
              <CodeEditor
                content={activeFile.content || ''}
                language={activeFile.language}
                filename={activeFile.name}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-ink/50">
                Selecione um arquivo no Explorer
              </div>
            )}
          </div>
        </section>

        {!showRight && !isCompact && (
          <button
            onClick={openChat}
            className="flex-shrink-0 w-8 border-l border-paper-line text-ink/45 hover:text-ink hover:bg-ink/[0.04] flex items-center justify-center"
            title="Abrir AI Assistant"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {showRight && (
          <aside
            className={cn(
              'flex-shrink-0 border-l border-paper-line bg-paper min-h-0',
              isCompact
                ? 'absolute inset-y-0 right-0 z-30 w-[340px] max-w-[90vw] shadow-2xl'
                : 'w-[340px]'
            )}
          >
            {rightPanel}
          </aside>
        )}
      </div>
    </div>
  );
}
