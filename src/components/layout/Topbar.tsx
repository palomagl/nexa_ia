import { HelpCircle, Plus, Search } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useNavigate } from 'react-router-dom';

export function Topbar() {
  const { setCommandOpen, workspace, user } = useStore();
  const navigate = useNavigate();
  const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2);

  return (
    <header className="sticky top-0 z-30 h-16 bg-paper-card/80 backdrop-blur-sm border-b border-paper-line2 flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-ink/50">Workspace</span>
        <span className="text-ink/30">/</span>
        <span className="font-display font-medium text-ink">{workspace.name}</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setCommandOpen(true)}
          className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-paper border border-paper-line2 text-sm text-ink/45 hover:border-lavender-deep/40 hover:text-ink/70 transition-all w-48 lg:w-64"
        >
          <Search className="w-4 h-4" />
          <span>Pesquisar seus projetos...</span>
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
          <span className="hidden sm:inline">Novo Projeto</span>
        </button>

        <button
          onClick={() => navigate('/settings')}
          title={user.name}
          className="w-9 h-9 rounded-full bg-sage flex items-center justify-center text-xs font-display font-semibold text-sage-ink border border-sage-deep/40 hover:border-sage-deep transition-all"
        >
          {initials}
        </button>
      </div>
    </header>
  );
}
