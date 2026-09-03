import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star as StarIcon, Clock, Share2, ArrowRight, Grid3x3, List, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn, formatDate } from '../lib/utils';
import { Dropdown } from '../components/ui/Dropdown';
import { Star } from '../components/ui/Doodles';
import type { Project } from '../types';

type FilterType = 'all' | 'website' | 'app' | 'dashboard' | 'prototype';
type SortType = 'recent' | 'name' | 'modified';

const typeLabel: Record<string, string> = {
  website: 'Site', app: 'App', dashboard: 'Dashboard', prototype: 'Protótipo',
};
const statusLabel: Record<string, string> = {
  live: 'no ar', building: 'gerando', draft: 'rascunho', error: 'erro',
};
const starTints = ['text-lavender-ink', 'text-sage-ink', 'text-rose-deep'];

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
    { label: 'Abrir', icon: <ArrowRight className="w-3.5 h-3.5" />, onClick: () => navigate(`/project/${p.id}`) },
    { label: p.starred ? 'Desfavoritar' : 'Favoritar', icon: <StarIcon className="w-3.5 h-3.5" />, onClick: () => toggleStar(p.id) },
    { label: 'Compartilhar', icon: <Share2 className="w-3.5 h-3.5" />, onClick: () => handleShare(p) },
    { label: 'Excluir', icon: <Trash2 className="w-3.5 h-3.5" />, danger: true, onClick: () => handleDelete(p) },
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
    { id: 'all', label: 'Todos' },
    { id: 'website', label: 'Sites' },
    { id: 'app', label: 'Apps' },
    { id: 'dashboard', label: 'Dashboards' },
    { id: 'prototype', label: 'Protótipos' },
  ];

  const statusChip = (status: string) => cn(
    'px-2 py-0.5 rounded-full text-[10px] font-medium',
    status === 'live' && 'bg-sage-soft text-sage-ink',
    status === 'building' && 'bg-lavender-soft text-lavender-ink',
    status === 'draft' && 'bg-paper-sunken text-ink/60',
    status === 'error' && 'bg-rose-soft text-rose-ink'
  );

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-6 py-6 lg:py-10">
      <div className="flex items-center gap-2 mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink doodle-underline">Projetos</h1>
        <Star size={14} fill className="text-lavender-deep/70 mb-1" rotate={-10} />
        <span className="hand text-lg text-ink/45 ml-1">{filtered.length}</span>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar projetos..."
            className="input-base w-full pl-10 text-sm"
          />
        </div>
        <div className="flex items-center gap-1 p-0.5 rounded-xl bg-paper-card border border-paper-line2">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                filter === f.id ? 'bg-lavender-soft text-lavender-ink' : 'text-ink/55 hover:text-ink'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortType)}
            className="input-base text-sm py-2"
          >
            <option value="recent">Recentes</option>
            <option value="name">Nome</option>
            <option value="modified">Modificação</option>
          </select>
          <div className="flex items-center gap-0.5 p-0.5 rounded-xl bg-paper-card border border-paper-line2">
            <button onClick={() => setView('grid')} className={cn('p-1.5 rounded-lg', view === 'grid' ? 'bg-lavender-soft text-lavender-ink' : 'text-ink/55')}>
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button onClick={() => setView('list')} className={cn('p-1.5 rounded-lg', view === 'list' ? 'bg-lavender-soft text-lavender-ink' : 'text-ink/55')}>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Star size={44} className="text-paper-line2" rotate={-8} />
          <p className="hand text-xl text-ink/45 mt-3">nenhum projeto encontrado</p>
          <p className="text-sm text-ink/40 mt-1">ajuste a busca ou os filtros</p>
        </div>
      )}

      {/* Grade */}
      {view === 'grid' && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p, i) => (
            <div
              key={p.id}
              onClick={() => navigate(`/project/${p.id}`)}
              className="group paper-card card-hover cursor-pointer p-4"
            >
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-paper-sunken flex items-center justify-center">
                  <Star size={26} fill className={starTints[i % starTints.length]} rotate={i % 2 ? 6 : -6} />
                </div>
                <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                  {p.starred && <StarIcon className="w-4 h-4 text-amber-400 fill-amber-400" />}
                  <Dropdown items={dropdownItems(p)} />
                </div>
              </div>
              <h3 className="font-display font-medium text-ink truncate mt-3">{p.name}</h3>
              <p className="text-xs text-ink/55 truncate mt-0.5">{p.description}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className={statusChip(p.status)}>{statusLabel[p.status] ?? p.status}</span>
                <span className="hand text-sm text-ink/45 flex items-center gap-1">
                  <Clock className="w-3 h-3" />{formatDate(p.lastModified)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lista */}
      {view === 'list' && filtered.length > 0 && (
        <div className="paper-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-paper-line2 text-xs text-ink/50 uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-display font-medium">Nome</th>
                <th className="text-left px-4 py-3 font-display font-medium hidden sm:table-cell">Tipo</th>
                <th className="text-left px-4 py-3 font-display font-medium hidden md:table-cell">Status</th>
                <th className="text-left px-4 py-3 font-display font-medium hidden lg:table-cell">Modificado</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr
                  key={p.id}
                  onClick={() => navigate(`/project/${p.id}`)}
                  className="border-b border-paper-line last:border-0 hover:bg-lavender-soft/30 cursor-pointer transition-all"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-paper-sunken flex items-center justify-center flex-shrink-0">
                        <Star size={18} fill className={starTints[i % starTints.length]} rotate={i % 2 ? 6 : -6} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink truncate flex items-center gap-2">
                          {p.name}
                          {p.starred && <StarIcon className="w-3 h-3 text-amber-400 fill-amber-400" />}
                        </p>
                        <p className="text-xs text-ink/45 truncate">{p.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell"><span className="text-sm text-ink/70">{typeLabel[p.type] ?? p.type}</span></td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={statusChip(p.status)}>{statusLabel[p.status] ?? p.status}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell hand text-sm text-ink/50">{formatDate(p.lastModified)}</td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
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
