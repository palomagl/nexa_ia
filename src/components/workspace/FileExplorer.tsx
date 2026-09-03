import { useState } from 'react';
import {
  Folder, FolderOpen, File as FileIcon, ChevronRight, ChevronDown,
  Plus, Trash2, FileCode, MoreHorizontal,
} from 'lucide-react';
import type { FileNode } from '../../types';
import { useStore } from '../../store/useStore';
import { cn } from '../../lib/utils';

interface Props {
  projectId: string;
  files: FileNode[];
  activeFileId: string | null;
  onSelectFile: (id: string) => void;
  onCollapse?: () => void;
}

export function FileExplorer({ projectId, files, activeFileId, onSelectFile, onCollapse }: Props) {
  const { addFile, deleteFile } = useStore();
  // Abre todas as pastas do projeto por padrão. Antes eram os ids 'f1'/'f5'
  // de um projeto mock, então projetos gerados abriam tudo fechado.
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(files.filter(f => f.type === 'folder').map(f => f.id))
  );
  const [showRootMenu, setShowRootMenu] = useState(false);

  const rootNodes = files.filter(f => f.parentId === null);

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    const tint =
      ext === 'tsx' || ext === 'ts' ? 'text-lavender-ink'
      : ext === 'css' ? 'text-rose-deep'
      : ext === 'json' ? 'text-sage-ink'
      : ext === 'html' ? 'text-rose-ink'
      : 'text-ink/50';
    return <FileCode className={cn('w-3.5 h-3.5', tint)} />;
  };

  const renderNode = (node: FileNode, depth: number): React.ReactNode => {
    const isExpanded = expanded.has(node.id);
    const children = node.type === 'folder' ? files.filter(f => f.parentId === node.id) : [];

    return (
      <div key={node.id}>
        <div
          className={cn(
            'group flex items-center gap-1.5 pr-1.5 py-0.5 rounded-md cursor-pointer text-[13px] transition-colors',
            activeFileId === node.id ? 'bg-lavender-soft text-ink' : 'text-ink/70 hover:bg-ink/[0.05] hover:text-ink'
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => node.type === 'folder' ? toggle(node.id) : onSelectFile(node.id)}
        >
          {node.type === 'folder' ? (
            <>
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 text-ink/55" /> : <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-ink/55" />}
              {isExpanded ? <FolderOpen className="w-3.5 h-3.5 flex-shrink-0 text-lavender-ink" /> : <Folder className="w-3.5 h-3.5 flex-shrink-0 text-lavender-ink" />}
            </>
          ) : (
            <>
              <span className="w-3.5 flex-shrink-0" />
              {getIcon(node.name)}
            </>
          )}
          <span className="truncate flex-1">{node.name}</span>
          <button
            onClick={e => { e.stopPropagation(); node.type === 'folder' ? addFile(projectId, 'new-file.tsx', node.id, 'file') : deleteFile(projectId, node.id); }}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-ink/10 transition-all"
          >
            {node.type === 'folder' ? <Plus className="w-3 h-3" /> : <Trash2 className="w-3 h-3" />}
          </button>
        </div>
        {node.type === 'folder' && isExpanded && children.map(child => renderNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-paper-line">
        <span className="font-display text-xs font-semibold uppercase tracking-wide text-ink/50">Arquivos</span>
        <div className="flex items-center gap-1">
          <div className="relative">
          <button onClick={() => setShowRootMenu(!showRootMenu)} className="p-1 rounded hover:bg-ink/[0.05] text-ink/55 hover:text-ink">
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
          {showRootMenu && (
            <div className="absolute right-0 top-full mt-1 w-36 glass-strong rounded-lg py-1 z-50">
              <button
                onClick={() => { addFile(projectId, 'new-file.tsx', null, 'file'); setShowRootMenu(false); }}
                className="w-full text-left px-3 py-1.5 text-xs text-ink/75 hover:bg-ink/[0.05] flex items-center gap-2"
              >
                <FileIcon className="w-3 h-3" /> Novo arquivo
              </button>
              <button
                onClick={() => { addFile(projectId, 'new-folder', null, 'folder'); setShowRootMenu(false); }}
                className="w-full text-left px-3 py-1.5 text-xs text-ink/75 hover:bg-ink/[0.05] flex items-center gap-2"
              >
                <Folder className="w-3 h-3" /> Nova pasta
              </button>
            </div>
          )}
          </div>
          {onCollapse && (
            <button
              onClick={onCollapse}
              className="p-1 rounded hover:bg-ink/[0.05] text-ink/55 hover:text-ink"
              title="Esconder painel"
            >
              <ChevronRight className="w-3.5 h-3.5 rotate-180" />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {rootNodes.map(node => renderNode(node, 0))}
      </div>
    </div>
  );
}
