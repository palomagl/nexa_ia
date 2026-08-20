import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Star, Clock, Users, ArrowRight } from 'lucide-react';
import { cn, formatDate } from '../lib/utils';

interface Props {
  filter: 'starred' | 'recent' | 'shared';
}

const config = {
  starred: { title: 'Starred Projects', icon: Star, desc: 'Projects you have starred', filter: (p: any) => p.starred },
  recent: { title: 'Recently Viewed', icon: Clock, desc: 'Projects you recently opened', filter: (p: any) => true },
  shared: { title: 'Shared with you', icon: Users, desc: 'Projects others shared with you', filter: (p: any) => p.shared },
};

export function FilteredProjects({ filter }: Props) {
  const navigate = useNavigate();
  const { projects } = useStore();
  const c = config[filter];
  const Icon = c.icon;
  const filtered = projects.filter(c.filter);

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl glass flex items-center justify-center">
          <Icon className="w-5 h-5 text-nexa-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{c.title}</h1>
          <p className="text-sm text-white/40">{c.desc}</p>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center mb-4">
            <Icon className="w-8 h-8 text-white/20" />
          </div>
          <p className="text-white/40">No projects here yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => (
            <div
              key={p.id}
              onClick={() => navigate(`/project/${p.id}`)}
              className="group glass rounded-2xl overflow-hidden card-hover cursor-pointer"
            >
              <div className={cn('h-32 bg-gradient-to-br relative', p.previewGradient)}>
                <div className="absolute inset-0 bg-black/20" />
                {p.starred && <Star className="absolute top-3 left-3 w-4 h-4 text-amber-400 fill-amber-400" />}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-white truncate">{p.name}</h3>
                <p className="text-xs text-white/40 truncate mt-0.5">{p.description}</p>
                <div className="flex items-center gap-2 mt-3 text-xs text-white/30">
                  <Clock className="w-3 h-3" />{formatDate(p.lastModified)}
                  <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-nexa-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
