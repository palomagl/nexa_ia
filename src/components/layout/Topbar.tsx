import { Bell, HelpCircle, Moon, Sun, Plus, Search } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { currentWorkspace } from '../../data/mockData';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useState, useEffect } from 'react';

export function Topbar({ onNewProject }: { onNewProject?: () => void }) {
  const { theme, toggleTheme, setCommandOpen } = useStore();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 h-16 glass border-b border-white/5 flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-white/40">Workspace</span>
          <span className="text-white/20">/</span>
          <span className="font-medium text-white">{currentWorkspace.name}</span>
        </div>
        <div className="hidden md:flex items-center gap-1 ml-4">
          <button className="btn-ghost text-sm">Build</button>
          <button className="btn-ghost text-sm">Deploy</button>
          <button className="btn-ghost text-sm">Analytics</button>
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

        <div className="relative">
          <button onClick={() => setNotifOpen(!notifOpen)} className="btn-ghost p-2.5 relative">
            <Bell className="w-[18px] h-[18px]" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-nexa-500 rounded-full glow-dot" />
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 glass-strong rounded-xl p-4 shadow-2xl animate-slide-up z-50">
              <p className="font-semibold text-white mb-3">Notifications</p>
              <div className="space-y-3">
                {[
                  { title: 'Build completed', desc: 'Sistema de Estoque deployed successfully', time: '2m ago' },
                  { title: 'AI suggestion', desc: 'Consider adding TypeScript types', time: '1h ago' },
                  { title: 'New template', desc: 'Dashboard template available', time: '3h ago' },
                ].map((n, i) => (
                  <div key={i} className="flex gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-all cursor-pointer">
                    <div className="w-2 h-2 rounded-full bg-nexa-500 mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{n.title}</p>
                      <p className="text-xs text-white/50 truncate">{n.desc}</p>
                      <p className="text-[10px] text-white/30 mt-0.5">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button className="btn-ghost p-2.5">
          <HelpCircle className="w-[18px] h-[18px]" />
        </button>

        <button
          onClick={onNewProject || (() => navigate('/'))}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Project</span>
        </button>
      </div>
    </header>
  );
}
