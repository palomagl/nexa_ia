import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Home, Folder, Settings, Plus, Star, Clock, Users,
  Sparkles, FileText, GitBranch, Rocket, Terminal, Download,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { cn } from '../../lib/utils';

export function CommandPalette() {
  const { commandOpen, setCommandOpen, projects, createProject } = useStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = [
    { icon: Home, label: 'Go to Home', action: () => navigate('/') },
    { icon: Folder, label: 'Go to Projects', action: () => navigate('/projects') },
    { icon: Star, label: 'Go to Starred', action: () => navigate('/starred') },
    { icon: Clock, label: 'Go to Recently viewed', action: () => navigate('/recent') },
    { icon: Users, label: 'Go to Shared with you', action: () => navigate('/shared') },
    { icon: Settings, label: 'Go to Settings', action: () => navigate('/settings') },
    { icon: Plus, label: 'Create new project', action: () => navigate('/') },
    { icon: Sparkles, label: 'Create with AI prompt', action: () => navigate('/') },
    { icon: GitBranch, label: 'Connect GitHub', action: () => navigate('/settings') },
    { icon: Rocket, label: 'Deploy a project', action: () => navigate('/projects') },
    { icon: Download, label: 'Import from Figma', action: () => navigate('/') },
    { icon: Terminal, label: 'Open terminal', action: () => navigate('/projects') },
  ];

  const projectCommands = projects.map(p => ({
    icon: FileText,
    label: `Open: ${p.name}`,
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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative w-full max-w-xl glass-strong rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
        <div className="flex items-center gap-3 px-4 border-b border-white/5">
          <Search className="w-5 h-5 text-white/40" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a command or search projects..."
            className="flex-1 bg-transparent py-4 text-white placeholder:text-white/30 focus:outline-none"
          />
          <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/30">ESC</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 && (
            <div className="px-3 py-8 text-center text-white/40 text-sm">No results found</div>
          )}
          {filtered.map((cmd, i) => (
            <button
              key={i}
              onClick={() => { cmd.action(); setCommandOpen(false); }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                i === selected ? 'bg-nexa-500/15 text-white' : 'text-white/60 hover:bg-white/5'
              )}
            >
              <cmd.icon className={cn('w-4 h-4', i === selected && 'text-nexa-400')} />
              <span>{cmd.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
