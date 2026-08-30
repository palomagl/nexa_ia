import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Home, Folder, Settings, Plus, Star, Clock, Users,
  Sparkles, FileText, GitBranch,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { cn } from '../../lib/utils';

export function CommandPalette() {
  const { commandOpen, setCommandOpen, projects } = useStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = [
    { icon: Home, label: 'Ir para o Início', action: () => navigate('/') },
    { icon: Folder, label: 'Ir para Projetos', action: () => navigate('/projects') },
    { icon: Star, label: 'Ir para Favoritos', action: () => navigate('/starred') },
    { icon: Clock, label: 'Ir para Todos os projetos', action: () => navigate('/all') },
    { icon: Users, label: 'Ir para Compartilhados', action: () => navigate('/shared') },
    { icon: Settings, label: 'Ir para Configurações', action: () => navigate('/settings') },
    { icon: Plus, label: 'Novo projeto', action: () => navigate('/') },
    { icon: Sparkles, label: 'Criar com a IA', action: () => navigate('/') },
    { icon: GitBranch, label: 'Conectar GitHub', action: () => navigate('/settings') },
  ];

  const projectCommands = projects.map(p => ({
    icon: FileText,
    label: `Abrir: ${p.name}`,
    action: () => navigate(`/project/${p.id}`),
  }));

  const all = [...commands, ...projectCommands];
  const filtered = query
    ? all.filter(c => c.label.toLowerCase().includes(query.toLowerCase()))
    : all;

  useEffect(() => {
    if (commandOpen) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [commandOpen]);

  useEffect(() => setSelected(0), [query]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen(!commandOpen);
      }
      if (!commandOpen) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === 'Enter' && filtered[selected]) { e.preventDefault(); filtered[selected].action(); setCommandOpen(false); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [commandOpen, filtered, selected, setCommandOpen]);

  if (!commandOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-start justify-center pt-[15vh] px-4"
      onClick={e => { if (e.target === e.currentTarget) setCommandOpen(false); }}
    >
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-xl glass-strong rounded-2xl shadow-paper-lg overflow-hidden animate-slide-up">
        <div className="flex items-center gap-3 px-4 border-b border-paper-line">
          <Search className="w-5 h-5 text-ink/55" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Digite um comando ou busque projetos..."
            className="flex-1 bg-transparent py-4 text-ink placeholder:text-ink/45 focus:outline-none"
          />
          <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-ink/[0.05] text-ink/45">ESC</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 && (
            <div className="px-3 py-8 text-center hand text-lg text-ink/45">nada encontrado</div>
          )}
          {filtered.map((cmd, i) => (
            <button
              key={i}
              onClick={() => { cmd.action(); setCommandOpen(false); }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                i === selected ? 'bg-lavender-soft text-ink' : 'text-ink/70 hover:bg-ink/[0.05]'
              )}
            >
              <cmd.icon className={cn('w-4 h-4', i === selected && 'text-lavender-ink')} />
              <span>{cmd.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
