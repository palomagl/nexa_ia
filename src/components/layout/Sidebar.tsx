import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home, Folder, Star, Clock, Users, HelpCircle,
  ChevronLeft, ChevronRight, Sparkles, Settings,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { cn } from '../../lib/utils';

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, user, workspace } = useStore();
  const navigate = useNavigate();
  const initials = user.name.split(' ').map(n => n[0]).join('');

  const mainNav = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Folder, label: 'Projects', path: '/projects' },
    { icon: Star, label: 'Starred', path: '/starred' },
    { icon: Clock, label: 'All Projects', path: '/all' },
    { icon: Users, label: 'Shared with you', path: '/shared' },
    { icon: HelpCircle, label: 'Help Center', path: '/help' },
  ];

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen glass border-r border-paper-line flex flex-col transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center h-16 border-b border-paper-line', sidebarCollapsed ? 'justify-center px-2' : 'px-5')}>
        {sidebarCollapsed ? (
          <div className="w-9 h-9 rounded-xl gradient-nexa flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-ink" />
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gradient-nexa flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-ink" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-extrabold tracking-tight text-ink">NEXA</span>
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
            onClick={() => navigate('/settings')}
            title="Configurações do workspace"
            className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-ink/[0.03] border border-paper-line hover:border-lavender-deep/30 transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-lavender flex items-center justify-center text-xs font-bold text-ink flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium text-ink truncate">{user.name}</p>
              <p className="text-xs text-ink/55 truncate">{workspace.name}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-ink/55" />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 scrollbar-hide">
        {!sidebarCollapsed && <p className="text-[10px] uppercase tracking-wider text-ink/45 font-semibold px-3 pt-2 pb-1">Menu</p>}
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
      </nav>

      {/* User footer */}
      <div className={cn('border-t border-paper-line p-3', sidebarCollapsed && 'px-2')}>
        <div className={cn('flex items-center gap-3', sidebarCollapsed && 'justify-center')}>
          <div className="w-8 h-8 rounded-lg bg-lavender flex items-center justify-center text-xs font-bold text-ink flex-shrink-0">
            {initials}
          </div>
          {!sidebarCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate">{user.name}</p>
                <p className="text-xs text-ink/55 truncate">{user.email}</p>
              </div>
              <button
                onClick={() => navigate('/settings')}
                title="Configurações"
                className="p-1.5 rounded-lg text-ink/55 hover:text-ink hover:bg-ink/[0.05] transition-all"
              >
                <Settings className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-paper-sunken border border-paper-line2 flex items-center justify-center text-ink/70 hover:text-ink hover:border-lavender-deep/50 transition-all z-50"
      >
        {sidebarCollapsed ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5 rotate-180" />}
      </button>
    </aside>
  );
}
