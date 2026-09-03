import { History, RotateCcw, GitBranch } from 'lucide-react';
import type { Version } from '../../types';
import { useStore } from '../../store/useStore';
import { formatDate } from '../../lib/utils';
import { cn } from '../../lib/utils';

interface Props {
  projectId: string;
  versions: Version[];
}

export function VersionsPanel({ projectId, versions }: Props) {
  const { addToast, createCheckpoint, restoreVersion } = useStore();

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-paper-line">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-lavender-ink" />
          <span className="font-display text-sm font-semibold text-ink">Histórico</span>
        </div>
        <button
          onClick={() => { createCheckpoint(projectId, 'Checkpoint manual'); addToast({ type: 'success', title: 'Checkpoint criado' }); }}
          className="text-xs px-2 py-1 rounded-lg bg-lavender-soft text-lavender-ink hover:bg-lavender hover:text-lavender-ink transition-all"
        >
          + Checkpoint
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <div className="relative">
          <div className="absolute left-3 top-2 bottom-2 w-px bg-ink/[0.05]" />
          <div className="space-y-1">
            {versions.map((v, i) => (
              <div
                key={v.id}
                className={cn(
                  'relative pl-8 pr-2 py-2.5 rounded-lg cursor-pointer transition-all group',
                  i === 0 ? 'bg-lavender-soft/70 border border-lavender-deep/30' : 'hover:bg-ink/[0.05]'
                )}
              >
                <div className={cn(
                  'absolute left-2 top-4 w-3 h-3 rounded-full border-2',
                  i === 0 ? 'bg-lavender-deep border-lavender-deep' : 'bg-paper-sunken border-paper-line2'
                )} />
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-ink">{v.label}</span>
                      {i === 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-lavender text-lavender-ink">atual</span>}
                    </div>
                    <p className="text-xs text-ink/55 truncate mt-0.5">{v.description}</p>
                    <p className="text-[10px] text-ink/35 mt-0.5">{formatDate(v.timestamp)}</p>
                  </div>
                  {i !== 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        restoreVersion(projectId, v.id);
                        addToast({ type: 'success', title: `Restaurado para ${v.label}`, message: 'Os arquivos do projeto foram revertidos.' });
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-ink/55 hover:text-ink hover:bg-ink/10 transition-all"
                      title="Restaurar esta versão"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 px-2 py-2.5 rounded-lg bg-paper-sunken border border-paper-line2">
          <div className="flex items-center gap-2 text-xs text-ink/55">
            <GitBranch className="w-3.5 h-3.5" />
            <span>main</span>
            <span className="text-ink/35">·</span>
            <span>{versions.length} {versions.length === 1 ? 'versão' : 'versões'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
