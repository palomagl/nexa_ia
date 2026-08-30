import { HelpCircle, Plus, Search } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useNavigate } from 'react-router-dom';

export function Topbar() {
  const { setCommandOpen, workspace } = useStore();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 h-16 glass border-b border-paper-line flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-ink/55">Workspace</span>
          <span className="text-ink/35">/</span>
          <span className="font-medium text-ink">{workspace.name}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setCommandOpen(true)}
          className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-ink/[0.03] border border-paper-line text-sm text-ink/55 hover:border-lavender-deep/30 hover:text-ink/70 transition-all w-48 lg:w-56"
        >
          <Search className="w-4 h-4" />
          <span>Search...</span>
          <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-ink/[0.05] text-ink/45">⌘K</kbd>
        </button>

        <button onClick={() => navigate('/help')} className="btn-ghost p-2.5" title="Ajuda">
          <HelpCircle className="w-[18px] h-[18px]" />
        </button>

        <button
          onClick={() => navigate('/')}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Project</span>
        </button>
      </div>
    </header>
  );
}
