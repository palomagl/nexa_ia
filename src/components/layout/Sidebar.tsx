import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home, Folder, Star as StarIcon, Users, HelpCircle,
  ChevronLeft, ChevronRight, Settings,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { cn } from '../../lib/utils';
import { Star } from '../ui/Doodles';

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, user, workspace } = useStore();
  const navigate = useNavigate();
  const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2);

  const mainNav = [
    { icon: Home, label: 'Início', path: '/' },
    { icon: Folder, label: 'Projetos', path: '/projects' },
    { icon: StarIcon, label: 'Favoritos', path: '/starred' },
    { icon: Users, label: 'Compartilhados', path: '/shared' },
    { icon: Settings, label: 'Configurações', path: '/settings' },
    { icon: HelpCircle, label: 'Ajuda', path: '/help' },
  ];

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-paper-card border-r border-paper-line2 shadow-paper-sm flex flex-col transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center h-16 border-b border-paper-line', sidebarCollapsed ? 'justify-center px-2' : 'px-5')}>
        {sidebarCollapsed ? (
          <Star size={22} fill className="text-lavender-deep" />
        ) : (
          <div className="flex items-baseline gap-1.5">
            <span className="font-display text-xl font-semibold tracking-tight text-ink">NEXA</span>
            <span className="font-display text-xl font-semibold tracking-tight text-lavender-ink">AI</span>
            <Star size={12} fill className="text-lavender-deep -translate-y-2 -ml-1" />
          </div>
        )}
      </div>

      {/* Workspace selector */}
      {!sidebarCollapsed && (
        <div className="px-3 pt-5">
          <button
            onClick={() => navigate('/settings')}
            title="Configurações do workspace"
            className="washi w-full flex items-center gap-3 p-2.5 rounded-xl bg-lavender-soft/40 border border-paper-line2 hover:border-lavender-deep/40 transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-lavender flex items-center justify-center text-xs font-display font-semibold text-lavender-ink flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-sm font-medium text-ink truncate">{user.name}</p>
              <p className="text-xs text-ink/55 truncate">{workspace.name}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-ink/45" />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 scrollbar-hide">
        {!sidebarCollapsed && <p className="hand text-base text-ink/45 px-3 pt-1 pb-2">menu</p>}
        {mainNav.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => cn('nav-item', isActive && 'nav-item-active', sidebarCollapsed && 'justify-center px-2')}
            title={sidebarCollapsed ? item.label : undefined}
          >
            {({ isActive }) => (
              <>
                <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                {!sidebarCollapsed && <span className="flex-1">{item.label}</span>}
                {!sidebarCollapsed && isActive && <Star size={13} fill className="text-lavender-deep flex-shrink-0" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className={cn('border-t border-paper-line p-3', sidebarCollapsed && 'px-2')}>
        <div className={cn('flex items-center gap-3', sidebarCollapsed && 'justify-center')}>
          <div className="w-8 h-8 rounded-lg bg-sage flex items-center justify-center text-xs font-display font-semibold text-sage-ink flex-shrink-0">
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
                className="p-1.5 rounded-lg text-ink/50 hover:text-ink hover:bg-ink/[0.05] transition-all"
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
        title={sidebarCollapsed ? 'Expandir' : 'Recolher'}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-paper-card border border-paper-line2 shadow-paper-sm flex items-center justify-center text-ink/60 hover:text-ink hover:border-lavender-deep/50 transition-all z-50"
      >
        <ChevronLeft className={cn('w-3.5 h-3.5 transition-transform', sidebarCollapsed && 'rotate-180')} />
      </button>
    </aside>
  );
}
