import { NavLink, useLocation } from 'react-router-dom';
import {
  Home, Folder, Star, Clock, Users, HelpCircle, FileText, Megaphone, Activity,
  ChevronLeft, ChevronDown, Sparkles, Settings, LogOut, Zap,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { currentUser, currentWorkspace } from '../../data/mockData';
import { cn } from '../../lib/utils';
import { useState } from 'react';

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useStore();
  const location = useLocation();
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  const mainNav = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Folder, label: 'Projects', path: '/projects' },
    { icon: Star, label: 'Starred', path: '/starred' },
    { icon: Clock, label: 'Recently viewed', path: '/recent' },
    { icon: Users, label: 'Shared with you', path: '/shared' },
  ];

  const moreNav = [
    { icon: HelpCircle, label: 'Help Center', path: '/help' },
    { icon: FileText, label: 'Documentation', path: '/docs' },
    { icon: Megaphone, label: 'Updates', path: '/updates' },
    { icon: Activity, label: 'Status', path: '/status' },
  ];

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen glass border-r border-white/5 flex flex-col transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center h-16 border-b border-white/5', sidebarCollapsed ? 'justify-center px-2' : 'px-5')}>
        {sidebarCollapsed ? (
          <div className="w-9 h-9 rounded-xl gradient-nexa flex items-center justify-center shadow-glow-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gradient-nexa flex items-center justify-center shadow-glow-sm">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-extrabold tracking-tight text-white">NEXA</span>
                <span className="text-lg font-extrabold tracking-tight gradient-text">AI</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Workspace selector */}
      {!sidebarCollapsed && (
        <div className="px-3 pt-3">
          <button
            onClick={() => setWorkspaceOpen(!workspaceOpen)}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-nexa-500/20 transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-nexa-600 to-violet-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              PG
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium text-white truncate">{currentUser.name}</p>
              <p className="text-xs text-white/40 truncate">{currentWorkspace.name}</p>
            </div>
            <ChevronDown className={cn('w-4 h-4 text-white/40 transition-transform', workspaceOpen && 'rotate-180')} />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 scrollbar-hide">
        {!sidebarCollapsed && <p className="text-[10px] uppercase tracking-wider text-white/30 font-semibold px-3 pt-2 pb-1">Menu</p>}
        {mainNav.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn('nav-item', isActive && 'nav-item-active', sidebarCollapsed && 'justify-center px-2')}
            title={sidebarCollapsed ? item.label : undefined}
          >
            <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
            {!sidebarCollapsed && <span>{item.label}</span>}
          </NavLink>
        ))}

        {!sidebarCollapsed && <div className="h-px bg-white/5 my-3" />}
        {!sidebarCollapsed && <p className="text-[10px] uppercase tracking-wider text-white/30 font-semibold px-3 pb-1">Resources</p>}
        {moreNav.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn('nav-item', isActive && 'nav-item-active', sidebarCollapsed && 'justify-center px-2')}
            title={sidebarCollapsed ? item.label : undefined}
          >
            <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
            {!sidebarCollapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Plan card */}
      {!sidebarCollapsed && (
        <div className="px-3 pb-3">
          <div className="rounded-xl p-4 bg-gradient-to-br from-nexa-500/10 to-violet-500/5 border border-nexa-500/15">
            <div className="flex items-center gap-2 mb-1.5">
              <Zap className="w-4 h-4 text-nexa-400" />
              <span className="text-sm font-semibold text-white">Free Plan</span>
            </div>
            <p className="text-xs text-white/40 mb-3">Seu espaco de criacao</p>
            <div className="mb-3">
              <div className="flex justify-between text-xs text-white/50 mb-1">
                <span>Projects</span>
                <span>3 / 5</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full gradient-nexa rounded-full" style={{ width: '60%' }} />
              </div>
            </div>
            <button className="w-full btn-primary text-xs py-2">Upgrade</button>
          </div>
        </div>
      )}

      {/* User footer */}
      <div className={cn('border-t border-white/5 p-3', sidebarCollapsed && 'px-2')}>
        <div className={cn('flex items-center gap-3', sidebarCollapsed && 'justify-center')}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-nexa-600 to-violet-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {currentUser.name.split(' ').map(n => n[0]).join('')}
          </div>
          {!sidebarCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{currentUser.name}</p>
                <p className="text-xs text-white/40 truncate">{currentUser.email}</p>
              </div>
              <button className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all">
                <Settings className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-bg-700 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-nexa-500/40 transition-all z-50"
      >
        {sidebarCollapsed ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5 rotate-180" />}
      </button>
    </aside>
  );
}
