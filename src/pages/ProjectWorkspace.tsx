import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Code2, Eye, MessageSquare, Terminal as TerminalIcon, History, Github, Rocket,
  PanelLeft, Sparkles, Download, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import { FileExplorer } from '../components/workspace/FileExplorer';
import { Preview } from '../components/workspace/Preview';
import { AIChat } from '../components/workspace/AIChat';
import { CodeEditor } from '../components/workspace/CodeEditor';
import { Terminal } from '../components/workspace/Terminal';
import { VersionsPanel } from '../components/workspace/VersionsPanel';
import { Modal } from '../components/ui/Modal';
import { Dropdown } from '../components/ui/Dropdown';

type ViewMode = 'preview' | 'code';
type RightView = 'chat' | 'history';
type BottomPanel = 'terminal' | 'none';

export function ProjectWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    getProject, addToast, updateProject,
  } = useStore();

  const project = id ? getProject(id) : undefined;

  const [view, setView] = useState<ViewMode>('preview');
  const [rightView, setRightView] = useState<RightView>('chat');
  const [bottomPanel, setBottomPanel] = useState<BottomPanel>('none');
  const [showExplorer, setShowExplorer] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 1440
  );
  const [showRight, setShowRight] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 1100
  );
  const [isCompact, setIsCompact] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 1024
  );
  const [activeFileId, setActiveFileId] = useState<string | null>('f2');
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [showGithubModal, setShowGithubModal] = useState(false);
  const [deployStep, setDeployStep] = useState<'idle' | 'building' | 'deploying' | 'done'>('idle');

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
          <p className="text-white/40 mb-4">Project not found</p>
          <button onClick={() => navigate('/projects')} className="btn-primary">Back to Projects</button>
        </div>
      </div>
    );
  }

  const activeFile = project.files.find(f => f.id === activeFileId);

  const handleDeploy = () => {
    setShowDeployModal(true);
    setDeployStep('building');
    setTimeout(() => setDeployStep('deploying'), 1500);
    setTimeout(() => {
      setDeployStep('done');
      updateProject(project.id, { status: 'live', deployUrl: `https://${project.name.toLowerCase().replace(/\s+/g, '-')}.nexa.ai` });
      addToast({ type: 'success', title: 'Deployed successfully', message: 'Your project is live!' });
    }, 3500);
  };

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
          <div className="h-11 flex-shrink-0 flex items-center justify-end px-2 border-b border-white/[0.06]">
            <button
              onClick={() => setShowRight(false)}
              className="p-1.5 rounded-md text-white/40 hover:text-white hover:bg-white/5"
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
    <div className="h-screen flex flex-col overflow-hidden bg-bg-900">
      <header className="h-14 flex-shrink-0 flex items-center justify-between gap-3 px-3 border-b border-white/[0.06] bg-bg-900">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 flex-shrink-0 rounded-lg hover:bg-white/5 px-1.5 py-1 transition-colors"
            title="Voltar"
          >
            <div className="w-7 h-7 rounded-lg gradient-nexa flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="hidden sm:flex items-baseline gap-1">
              <span className="text-sm font-bold tracking-tight text-white">NEXA</span>
              <span className="text-sm font-bold tracking-tight gradient-text">AI</span>
            </span>
          </button>

          <div className="h-4 w-px bg-white/10 flex-shrink-0" />

          <p className="text-sm font-medium text-white truncate max-w-[220px] sm:max-w-xs">
            {project.name}
          </p>
        </div>

        <div className="flex items-center p-0.5 rounded-lg bg-white/[0.04]">
          <button
            onClick={() => setView('preview')}
            className={cn(
              'px-3 h-8 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors',
              view === 'preview' ? 'bg-white/10 text-white' : 'text-white/45 hover:text-white'
            )}
          >
            <Eye className="w-3.5 h-3.5" /> Preview
          </button>
          <button
            onClick={() => setView('code')}
            className={cn(
              'px-3 h-8 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors',
              view === 'code' ? 'bg-white/10 text-white' : 'text-white/45 hover:text-white'
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
              showExplorer ? 'text-white bg-white/10' : 'text-white/40 hover:text-white hover:bg-white/5'
            )}
            title={showExplorer ? 'Esconder Explorer' : 'Abrir Explorer'}
          >
            <PanelLeft className="w-4 h-4" />
          </button>
          <button
            onClick={openChat}
            className={cn(
              'p-2 rounded-md transition-colors',
              showRight && rightView === 'chat' ? 'text-white bg-white/10' : 'text-white/40 hover:text-white hover:bg-white/5'
            )}
            title={showRight && rightView === 'chat' ? 'Esconder AI Assistant' : 'Abrir AI Assistant'}
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          <Dropdown
            items={[
              {
                label: rightView === 'history' && showRight ? 'Fechar histórico' : 'Histórico',
                icon: <History className="w-3.5 h-3.5" />,
                onClick: () => {
                  if (rightView === 'history' && showRight) setShowRight(false);
                  else openHistory();
                },
              },
              {
                label: bottomPanel === 'terminal' ? 'Fechar terminal' : 'Terminal',
                icon: <TerminalIcon className="w-3.5 h-3.5" />,
                onClick: () => setBottomPanel(p => (p === 'terminal' ? 'none' : 'terminal')),
              },
              {
                label: 'Push to GitHub',
                icon: <Github className="w-3.5 h-3.5" />,
                onClick: () => setShowGithubModal(true),
              },
            ]}
          />

          <button
            onClick={handleDeploy}
            className="ml-1 h-8 px-3 rounded-lg gradient-nexa text-xs font-semibold text-white flex items-center gap-1.5 hover:opacity-90 transition-opacity"
          >
            <Rocket className="w-3.5 h-3.5" /> Deploy
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex overflow-hidden relative">
        {isCompact && (showExplorer || showRight) && (
          <button
            type="button"
            aria-label="Fechar painel"
            className="absolute inset-0 z-20 bg-black/40"
            onClick={() => {
              setShowExplorer(false);
              setShowRight(false);
            }}
          />
        )}

        {showExplorer && (
          <aside
            className={cn(
              'flex-shrink-0 border-r border-white/[0.06] bg-bg-900 min-h-0',
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
            className="flex-shrink-0 w-8 border-r border-white/[0.06] text-white/30 hover:text-white hover:bg-white/[0.03] flex items-center justify-center"
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
              <div className="h-full flex items-center justify-center text-sm text-white/35">
                Selecione um arquivo no Explorer
              </div>
            )}
          </div>

          {bottomPanel === 'terminal' && (
            <div className="h-44 flex-shrink-0 border-t border-white/[0.06]">
              <Terminal />
            </div>
          )}
        </section>

        {!showRight && !isCompact && (
          <button
            onClick={openChat}
            className="flex-shrink-0 w-8 border-l border-white/[0.06] text-white/30 hover:text-white hover:bg-white/[0.03] flex items-center justify-center"
            title="Abrir AI Assistant"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {showRight && (
          <aside
            className={cn(
              'flex-shrink-0 border-l border-white/[0.06] bg-bg-900 min-h-0',
              isCompact
                ? 'absolute inset-y-0 right-0 z-30 w-[340px] max-w-[90vw] shadow-2xl'
                : 'w-[340px]'
            )}
          >
            {rightPanel}
          </aside>
        )}
      </div>

      <Modal open={showDeployModal} onClose={() => deployStep === 'done' && setShowDeployModal(false)}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl gradient-nexa flex items-center justify-center">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Deploy Project</h2>
              <p className="text-sm text-white/40">Publishing {project.name}</p>
            </div>
          </div>

          {deployStep !== 'done' && (
            <div className="space-y-3 py-4">
              {['building', 'deploying'].filter(s => deployStep === s || (deployStep === 'deploying' && s === 'building')).map(step => (
                <div key={step} className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-nexa-500/30 border-t-nexa-500 rounded-full animate-spin" />
                  <span className="text-sm text-white/60 capitalize">{step === 'building' ? 'Building project...' : 'Deploying to edge network...'}</span>
                </div>
              ))}
            </div>
          )}

          {deployStep === 'done' && (
            <div className="py-4">
              <div className="flex items-center gap-2 mb-4 text-green-400">
                <Sparkles className="w-5 h-5" />
                <span className="font-semibold">Your project is live!</span>
              </div>
              <div className="glass rounded-xl p-3 flex items-center justify-between">
                <span className="text-sm text-nexa-300 truncate">{project.deployUrl || `https://${project.name.toLowerCase().replace(/\s+/g, '-')}.nexa.ai`}</span>
                <a href="#" target="_blank" rel="noopener" className="p-1.5 rounded-lg bg-nexa-500/15 text-nexa-300 hover:bg-nexa-500/25 transition-all">
                  <Download className="w-4 h-4" />
                </a>
              </div>
              <button onClick={() => setShowDeployModal(false)} className="btn-primary w-full mt-4">Done</button>
            </div>
          )}
        </div>
      </Modal>

      <Modal open={showGithubModal} onClose={() => setShowGithubModal(false)}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
              <Github className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Push to GitHub</h2>
              <p className="text-sm text-white/40">Connect and push your project</p>
            </div>
          </div>

          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                <span className="text-green-400 text-xs">✓</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-white">Connected as @paloma-garcia</p>
                <p className="text-xs text-white/40">GitHub account linked</p>
              </div>
            </div>

            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Repository name</label>
              <input
                defaultValue={project.name.toLowerCase().replace(/\s+/g, '-')}
                className="input-base w-full text-sm"
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                <input type="checkbox" defaultChecked className="rounded border-white/20 bg-white/5 text-nexa-500" /> Private repo
              </label>
            </div>

            <button
              onClick={() => { addToast({ type: 'success', title: 'Pushed to GitHub', message: 'Repository created and code pushed' }); setShowGithubModal(false); }}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Github className="w-4 h-4" /> Push to GitHub
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
