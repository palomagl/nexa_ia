import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Star as StarIcon, Clock, Users, ArrowRight } from 'lucide-react';
import { formatDate } from '../lib/utils';
import { Star } from '../components/ui/Doodles';

interface Props {
  filter: 'starred' | 'all' | 'shared';
}

const config = {
  starred: { title: 'Favoritos', icon: StarIcon, desc: 'Os projetos que você marcou com estrela', filter: (p: any) => p.starred },
  all: { title: 'Todos os projetos', icon: Clock, desc: 'Tudo neste workspace', filter: () => true },
  shared: { title: 'Compartilhados', icon: Users, desc: 'Projetos que compartilharam com você', filter: (p: any) => p.shared },
};

const starTints = ['text-lavender-ink', 'text-sage-ink', 'text-rose-deep'];

export function FilteredProjects({ filter }: Props) {
  const navigate = useNavigate();
  const { projects } = useStore();
  const c = config[filter];
  const Icon = c.icon;
  const filtered = projects.filter(c.filter);

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-6 py-6 lg:py-10">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-11 h-11 rounded-xl bg-lavender-soft flex items-center justify-center">
          <Icon className="w-5 h-5 text-lavender-ink" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink flex items-center gap-2">
            {c.title}
            <Star size={13} fill className="text-sage-deep/70" rotate={-10} />
          </h1>
          <p className="hand text-lg text-ink/50 -mt-0.5">{c.desc}</p>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Star size={44} className="text-paper-line2" rotate={-8} />
          <p className="hand text-xl text-ink/45 mt-3">nada aqui ainda</p>
        </div>
      ) : (
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
                {p.starred && <StarIcon className="w-4 h-4 text-amber-400 fill-amber-400 mt-1" />}
              </div>
              <h3 className="font-display font-medium text-ink truncate mt-3">{p.name}</h3>
              <p className="text-xs text-ink/55 truncate mt-0.5">{p.description}</p>
              <div className="flex items-center gap-1.5 mt-3 hand text-sm text-ink/45">
                <Clock className="w-3.5 h-3.5" />
                editado {formatDate(p.lastModified)}
                <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-lavender-ink" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
