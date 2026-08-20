import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Code2, Eye, MessageSquare, Terminal as TerminalIcon, History, Github, Rocket,
  Monitor, PanelLeft, PanelRight, Sparkles, AlertCircle, Wand2, X, Download,
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

type ViewMode = 'preview' | 'code';
type RightPanel = 'chat' | 'history' | 'none';
type BottomPanel = 'terminal' | 'none';

export function ProjectWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    getProject, updateFileContent, addToast, updateProject,
  } = useStore();

  const project = id ? getProject(id) : undefined;

  const [view, setView] = useState<ViewMode>('preview');
  const [rightPanel, setRightPanel] = useState<RightPanel>('chat');
  const [bottomPanel, setBottomPanel] = useState<BottomPanel>('none');
  const [showFileExplorer, setShowFileExplorer] = useState(true);
  const [activeFileId, setActiveFileId] = useState<string | null>('f2');
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [showGithubModal, setShowGithubModal] = useState(false);
  const [deployStep, setDeployStep] = useState<'idle' | 'building' | 'deploying' | 'done'>('idle');

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

  const handleFixWithAI = () => {
    addToast({ type: 'loading', title: 'AI is analyzing the error...' });
    setTimeout(() => {
      updateProject(project.id, { status: 'building' });
      addToast({ type: 'success', title: 'Error fixed by AI', message: 'Build is now passing' });
    }, 2000);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      {/* Project header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 glass">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => navigate('/')} className="btn-ghost p-1.5">
            <X className="w-4 h-4" />
          </button>
          <div className={cn('w-7 h-7 rounded-lg bg-gradient-to-br flex-shrink-0', project.previewGradient)} />
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-white truncate">{project.name}</h1>
            <p className="text-xs text-white/40 truncate">{project.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-white/[0.03] border border-white/5">
            <button
              onClick={() => setView('preview')}
              className={cn('px-3 py-1.5 rounded-md text-xs flex items-center gap-1.5 transition-all', view === 'preview' ? 'bg-nexa-500/15 text-nexa-300' : 'text-white/40 hover:text-white')}
            >
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
            <button
              onClick={() => setView('code')}
              className={cn('px-3 py-1.5 rounded-md text-xs flex items-center gap-1.5 transition-all', view === 'code' ? 'bg-nexa-500/15 text-nexa-300' : 'text-white/40 hover:text-white')}
            >
              <Code2 className="w-3.5 h-3.5" /> Code
            </button>
          </div>

          {/* Panel toggles */}
          <button
            onClick={() => setShowFileExplorer(!showFileExplorer)}
            className={cn('p-2 rounded-lg transition-all', showFileExplorer ? 'text-nexa-300 bg-nexa-500/10' : 'text-white/40 hover:text-white hover:bg-white/5')}
            title="Toggle files"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setRightPanel(rightPanel === 'chat' ? 'none' : 'chat')}
            className={cn('p-2 rounded-lg transition-all', rightPanel === 'chat' ? 'text-nexa-300 bg-nexa-500/10' : 'text-white/40 hover:text-white hover:bg-white/5')}
            title="Toggle AI chat"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          <button
            onClick={() => setRightPanel(rightPanel === 'history' ? 'none' : 'history')}
            className={cn('p-2 rounded-lg transition-all', rightPanel === 'history' ? 'text-nexa-300 bg-nexa-500/10' : 'text-white/40 hover:text-white hover:bg-white/5')}
            title="Toggle history"
          >
            <History className="w-4 h-4" />
          </button>
          <button
            onClick={() => setBottomPanel(bottomPanel === 'terminal' ? 'none' : 'terminal')}
            className={cn('p-2 rounded-lg transition-all', bottomPanel === 'terminal' ? 'text-nexa-300 bg-nexa-500/10' : 'text-white/40 hover:text-white hover:bg-white/5')}
            title="Toggle terminal"
          >
            <TerminalIcon className="w-4 h-4" />
          </button>

          <div className="h-5 w-px bg-white/10" />

          <button onClick={() => setShowGithubModal(true)} className="btn-outline text-xs py-2 px-3 flex items-center gap-1.5">
            <Github className="w-3.5 h-3.5" /> Push
          </button>
          <button onClick={handleDeploy} className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5">
            <Rocket className="w-3.5 h-3.5" /> Deploy
          </button>
        </div>
      </div>

      {/* Build error banner */}
      {project.status === 'error' && (
        <div className="flex items-center justify-between px-4 py-2 bg-red-500/10 border-b border-red-500/20">
          <div className="flex items-center gap-2 text-sm text-red-300">
            <AlertCircle className="w-4 h-4" />
            <span>Build failed — 1 error found</span>
          </div>
          <button onClick={handleFixWithAI} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-all text-xs font-medium">
            <Wand2 className="w-3.5 h-3.5" /> Fix with AI
          </button>
        </div>
      )}

      {/* Main workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer */}
        {showFileExplorer && (
          <div className="w-56 flex-shrink-0 border-r border-white/5 bg-bg-850">
            <FileExplorer
              projectId={project.id}
              files={project.files}
              activeFileId={activeFileId}
              onSelectFile={(fid) => { setActiveFileId(fid); setView('code'); }}
            />
          </div>
        )}

        {/* Center area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            {view === 'preview' ? (
              <Preview html={project.previewHtml} projectName={project.name} />
            ) : (
              activeFile && (
                <CodeEditor
                  content={activeFile.content || ''}
                  language={activeFile.language}
                  filename={activeFile.name}
                />
              )
            )}
          </div>

          {/* Terminal */}
          {bottomPanel === 'terminal' && (
            <div className="h-56 flex-shrink-0 border-t border-white/5">
              <Terminal />
            </div>
          )}
        </div>

        {/* Right panel */}
        {rightPanel !== 'none' && (
          <div className="w-80 lg:w-96 flex-shrink-0 border-l border-white/5 bg-bg-850">
            {rightPanel === 'chat' && <AIChat projectId={project.id} messages={project.chat} />}
            {rightPanel === 'history' && <VersionsPanel projectId={project.id} versions={project.versions} />}
          </div>
        )}
      </div>

      {/* Deploy Modal */}
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
                <span className="ml-1">🚀</span>
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

      {/* GitHub Modal */}
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
