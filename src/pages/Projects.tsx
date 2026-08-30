import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, Clock, Share2, ArrowRight, Grid3x3, List, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn, formatDate } from '../lib/utils';
import { Dropdown } from '../components/ui/Dropdown';
import type { Project } from '../types';

type FilterType = 'all' | 'website' | 'app' | 'dashboard' | 'prototype';
type SortType = 'recent' | 'name' | 'modified';

export function Projects() {
  const navigate = useNavigate();
  const { projects, toggleStar, deleteProject, addToast } = useStore();
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('recent');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const handleShare = (p: Project) => {
    const url = `${window.location.origin}/project/${p.id}`;
    navigator.clipboard
      .writeText(url)
      .then(() => addToast({ type: 'success', title: 'Link copiado!', message: url }))
      .catch(() => addToast({ type: 'error', title: 'Não foi possível copiar o link' }));
  };

  const handleDelete = (p: Project) => {
    if (window.confirm(`Excluir "${p.name}"? Essa ação não pode ser desfeita.`)) {
      deleteProject(p.id);
      addToast({ type: 'success', title: 'Projeto excluído' });
    }
  };

  const dropdownItems = (p: Project) => [
    { label: 'Open', icon: <ArrowRight className="w-3.5 h-3.5" />, onClick: () => navigate(`/project/${p.id}`) },
    { label: p.starred ? 'Unstar' : 'Star', icon: <Star className="w-3.5 h-3.5" />, onClick: () => toggleStar(p.id) },
    { label: 'Share', icon: <Share2 className="w-3.5 h-3.5" />, onClick: () => handleShare(p) },
    { label: 'Delete', icon: <Trash2 className="w-3.5 h-3.5" />, danger: true, onClick: () => handleDelete(p) },
  ];

  const filtered = useMemo(() => {
    let result = projects;
    if (filter !== 'all') result = result.filter(p => p.type === filter);
    if (search) result = result.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()));
    if (sort === 'recent') result = [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (sort === 'name') result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'modified') result = [...result].sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
    return result;
  }, [projects, filter, sort, search]);

  const filters: { id: FilterType; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'website', label: 'Websites' },
    { id: 'app', label: 'Apps' },
    { id: 'dashboard', label: 'Dashboards' },
    { id: 'prototype', label: 'Prototypes' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Projects</h1>
          <p className="text-sm text-ink/55 mt-0.5">{filtered.length} projects</p>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/45" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="input-base w-full pl-10 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-ink/[0.03] border border-paper-line">
            {filters.map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                  filter === f.id ? 'bg-lavender-soft text-lavender-ink' : 'text-ink/55 hover:text-ink'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortType)}
            className="input-base text-sm py-2"
          >
            <option value="recent">Recent</option>
            <option value="name">Name</option>
            <option value="modified">Last modified</option>
          </select>
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-ink/[0.03] border border-paper-line">
            <button onClick={() => setView('grid')} className={cn('p-1.5 rounded-md', view === 'grid' ? 'bg-lavender-soft text-lavender-ink' : 'text-ink/55')}>
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button onClick={() => setView('list')} className={cn('p-1.5 rounded-md', view === 'list' ? 'bg-lavender-soft text-lavender-ink' : 'text-ink/55')}>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-ink/35" />
          </div>
          <p className="text-ink/55 mb-1">No projects found</p>
          <p className="text-sm text-ink/45">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Grid view */}
      {view === 'grid' && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => (
            <div
              key={p.id}
              onClick={() => navigate(`/project/${p.id}`)}
              className="group glass rounded-2xl overflow-hidden card-hover cursor-pointer"
            >
              <div className={cn('h-32 bg-gradient-to-br relative overflow-hidden', p.previewGradient)}>
                <div className="absolute inset-0 bg-ink/10" />
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="glass-strong rounded-lg p-2">
                    <div className="h-1.5 w-3/4 bg-ink/15 rounded mb-1.5" />
                    <div className="h-1.5 w-1/2 bg-ink/10 rounded" />
                  </div>
                </div>
                {p.starred && <Star className="absolute top-3 left-3 w-4 h-4 text-amber-400 fill-amber-400" />}
                <span className={cn(
                  'absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-md',
                  p.status === 'live' && 'bg-green-500/20 text-green-300',
                  p.status === 'building' && 'bg-lavender-soft text-lavender-ink',
                  p.status === 'draft' && 'bg-ink/10 text-ink/70',
                  p.status === 'error' && 'bg-red-500/20 text-red-300'
                )}>
                  {p.status}
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-ink truncate">{p.name}</h3>
                    <p className="text-xs text-ink/55 truncate mt-0.5">{p.description}</p>
                  </div>
                  <Dropdown items={dropdownItems(p)} />
                </div>
                <div className="flex items-center gap-3 mt-3 text-xs text-ink/45">
                  <span className="capitalize">{p.type}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(p.lastModified)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List view */}
      {view === 'list' && filtered.length > 0 && (
        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-paper-line text-xs text-ink/55 uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Type</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Status</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Modified</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr
                  key={p.id}
                  onClick={() => navigate(`/project/${p.id}`)}
                  className="border-b border-paper-line last:border-0 hover:bg-ink/[0.03] cursor-pointer transition-all group"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={cn('w-8 h-8 rounded-lg bg-gradient-to-br flex-shrink-0', p.previewGradient)} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink truncate flex items-center gap-2">
                          {p.name}
                          {p.starred && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                        </p>
                        <p className="text-xs text-ink/45 truncate">{p.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell"><span className="text-sm text-ink/70 capitalize">{p.type}</span></td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      p.status === 'live' && 'bg-green-500/15 text-green-300',
                      p.status === 'building' && 'bg-lavender-soft text-lavender-ink',
                      p.status === 'draft' && 'bg-ink/[0.05] text-ink/60',
                      p.status === 'error' && 'bg-red-500/15 text-red-300'
                    )}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-sm text-ink/55">{formatDate(p.lastModified)}</td>
                  <td className="px-4 py-3">
                    <Dropdown items={dropdownItems(p)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
