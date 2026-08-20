import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, Clock, Share2, ArrowRight, Grid3x3, List, MoreVertical } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn, formatDate } from '../lib/utils';
import { Dropdown } from '../components/ui/Dropdown';

type FilterType = 'all' | 'website' | 'app' | 'dashboard' | 'prototype';
type SortType = 'recent' | 'name' | 'modified';

export function Projects() {
  const navigate = useNavigate();
  const { projects, toggleStar, addToast } = useStore();
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('recent');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');

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
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-sm text-white/40 mt-0.5">{filtered.length} projects</p>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="input-base w-full pl-10 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white/[0.02] border border-white/5">
            {filters.map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                  filter === f.id ? 'bg-nexa-500/15 text-nexa-300' : 'text-white/40 hover:text-white'
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
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-white/[0.02] border border-white/5">
            <button onClick={() => setView('grid')} className={cn('p-1.5 rounded-md', view === 'grid' ? 'bg-nexa-500/15 text-nexa-300' : 'text-white/40')}>
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button onClick={() => setView('list')} className={cn('p-1.5 rounded-md', view === 'list' ? 'bg-nexa-500/15 text-nexa-300' : 'text-white/40')}>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-white/20" />
          </div>
          <p className="text-white/40 mb-1">No projects found</p>
          <p className="text-sm text-white/30">Try adjusting your search or filters</p>
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
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="glass-strong rounded-lg p-2">
                    <div className="h-1.5 w-3/4 bg-white/20 rounded mb-1.5" />
                    <div className="h-1.5 w-1/2 bg-white/10 rounded" />
                  </div>
                </div>
                {p.starred && <Star className="absolute top-3 left-3 w-4 h-4 text-amber-400 fill-amber-400" />}
                <span className={cn(
                  'absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-md',
                  p.status === 'live' && 'bg-green-500/20 text-green-300',
                  p.status === 'building' && 'bg-nexa-500/20 text-nexa-300',
                  p.status === 'draft' && 'bg-white/10 text-white/60',
                  p.status === 'error' && 'bg-red-500/20 text-red-300'
                )}>
                  {p.status}
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-white truncate">{p.name}</h3>
                    <p className="text-xs text-white/40 truncate mt-0.5">{p.description}</p>
                  </div>
                  <Dropdown
                    items={[
                      { label: 'Open', icon: <ArrowRight className="w-3.5 h-3.5" />, onClick: () => navigate(`/project/${p.id}`) },
                      { label: p.starred ? 'Unstar' : 'Star', icon: <Star className="w-3.5 h-3.5" />, onClick: () => toggleStar(p.id) },
                      { label: 'Share', icon: <Share2 className="w-3.5 h-3.5" />, onClick: () => addToast({ type: 'info', title: 'Share link copied' }) },
                      { label: 'Delete', icon: <MoreVertical className="w-3.5 h-3.5" />, danger: true, onClick: () => addToast({ type: 'info', title: 'Project deleted' }) },
                    ]}
                  />
                </div>
                <div className="flex items-center gap-3 mt-3 text-xs text-white/30">
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
              <tr className="border-b border-white/5 text-xs text-white/40 uppercase tracking-wider">
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
                  className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] cursor-pointer transition-all group"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={cn('w-8 h-8 rounded-lg bg-gradient-to-br flex-shrink-0', p.previewGradient)} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate flex items-center gap-2">
                          {p.name}
                          {p.starred && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                        </p>
                        <p className="text-xs text-white/30 truncate">{p.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell"><span className="text-sm text-white/60 capitalize">{p.type}</span></td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      p.status === 'live' && 'bg-green-500/15 text-green-300',
                      p.status === 'building' && 'bg-nexa-500/15 text-nexa-300',
                      p.status === 'draft' && 'bg-white/5 text-white/50',
                      p.status === 'error' && 'bg-red-500/15 text-red-300'
                    )}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-sm text-white/40">{formatDate(p.lastModified)}</td>
                  <td className="px-4 py-3">
                    <Dropdown
                      items={[
                        { label: 'Open', icon: <ArrowRight className="w-3.5 h-3.5" />, onClick: () => navigate(`/project/${p.id}`) },
                        { label: p.starred ? 'Unstar' : 'Star', icon: <Star className="w-3.5 h-3.5" />, onClick: () => toggleStar(p.id) },
                        { label: 'Share', icon: <Share2 className="w-3.5 h-3.5" />, onClick: () => addToast({ type: 'info', title: 'Share link copied' }) },
                        { label: 'Delete', icon: <MoreVertical className="w-3.5 h-3.5" />, danger: true, onClick: () => addToast({ type: 'info', title: 'Project deleted' }) },
                      ]}
                    />
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
