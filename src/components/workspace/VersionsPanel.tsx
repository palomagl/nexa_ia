import { History, RotateCcw, Check, GitBranch } from 'lucide-react';
import type { Version } from '../../types';
import { useStore } from '../../store/useStore';
import { formatDate } from '../../lib/utils';
import { cn } from '../../lib/utils';

interface Props {
  projectId: string;
  versions: Version[];
}

export function VersionsPanel({ projectId, versions }: Props) {
  const { addToast, createCheckpoint } = useStore();

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-nexa-400" />
          <span className="text-sm font-semibold text-white">History</span>
        </div>
        <button
          onClick={() => { createCheckpoint(projectId, 'Manual checkpoint'); addToast({ type: 'success', title: 'Checkpoint created' }); }}
          className="text-xs px-2 py-1 rounded-lg bg-nexa-500/10 text-nexa-300 hover:bg-nexa-500/20 transition-all"
        >
          + Checkpoint
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <div className="relative">
          <div className="absolute left-3 top-2 bottom-2 w-px bg-white/5" />
          <div className="space-y-1">
            {versions.map((v, i) => (
              <div
                key={v.id}
                className={cn(
                  'relative pl-8 pr-2 py-2.5 rounded-lg cursor-pointer transition-all group',
                  i === 0 ? 'bg-nexa-500/10 border border-nexa-500/20' : 'hover:bg-white/5'
                )}
              >
                <div className={cn(
                  'absolute left-2 top-4 w-3 h-3 rounded-full border-2',
                  i === 0 ? 'bg-nexa-500 border-nexa-500 shadow-glow-sm' : 'bg-bg-700 border-white/20'
                )} />
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{v.label}</span>
                      {i === 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-nexa-500/20 text-nexa-300">Current</span>}
                    </div>
                    <p className="text-xs text-white/40 truncate mt-0.5">{v.description}</p>
                    <p className="text-[10px] text-white/20 mt-0.5">{formatDate(v.timestamp)}</p>
                  </div>
                  {i !== 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); addToast({ type: 'info', title: `Restored to ${v.label}`, message: 'Project reverted to this version' }); }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 px-2 py-2.5 rounded-lg bg-white/[0.02] border border-white/5">
          <div className="flex items-center gap-2 text-xs text-white/40">
            <GitBranch className="w-3.5 h-3.5" />
            <span>main</span>
            <span className="text-white/20">·</span>
            <span>{versions.length} versions</span>
          </div>
        </div>
      </div>
    </div>
  );
}
