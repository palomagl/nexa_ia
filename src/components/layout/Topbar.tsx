import { HelpCircle, Moon, Sun, Plus, Search } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useNavigate } from 'react-router-dom';

export function Topbar() {
  const { theme, toggleTheme, setCommandOpen, workspace } = useStore();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 h-16 glass border-b border-white/5 flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-white/40">Workspace</span>
          <span className="text-white/20">/</span>
          <span className="font-medium text-white">{workspace.name}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setCommandOpen(true)}
          className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5 text-sm text-white/40 hover:border-nexa-500/20 hover:text-white/60 transition-all w-48 lg:w-56"
        >
          <Search className="w-4 h-4" />
          <span>Search...</span>
          <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/30">⌘K</kbd>
        </button>

        <button onClick={toggleTheme} className="btn-ghost p-2.5">
          {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
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
