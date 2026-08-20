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
}

export function FileExplorer({ projectId, files, activeFileId, onSelectFile }: Props) {
  const { addFile, deleteFile } = useStore();
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['f1', 'f5']));
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
    return <FileCode className={cn('w-3.5 h-3.5', ext === 'tsx' ? 'text-blue-400' : ext === 'ts' ? 'text-blue-300' : ext === 'css' ? 'text-pink-400' : ext === 'json' ? 'text-yellow-400' : ext === 'html' ? 'text-orange-400' : 'text-white/40')} />;
  };

  const renderNode = (node: FileNode, depth: number): React.ReactNode => {
    const isExpanded = expanded.has(node.id);
    const children = node.type === 'folder' ? files.filter(f => f.parentId === node.id) : [];

    return (
      <div key={node.id}>
        <div
          className={cn(
            'group flex items-center gap-1.5 pr-2 py-1 rounded-md cursor-pointer text-sm transition-all',
            activeFileId === node.id ? 'bg-nexa-500/15 text-white' : 'text-white/60 hover:bg-white/5 hover:text-white'
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => node.type === 'folder' ? toggle(node.id) : onSelectFile(node.id)}
        >
          {node.type === 'folder' ? (
            <>
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 text-white/40" /> : <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-white/40" />}
              {isExpanded ? <FolderOpen className="w-3.5 h-3.5 flex-shrink-0 text-nexa-400" /> : <Folder className="w-3.5 h-3.5 flex-shrink-0 text-nexa-400" />}
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
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/10 transition-all"
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
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/5">
        <span className="text-xs font-semibold uppercase tracking-wider text-white/40">Explorer</span>
        <div className="relative">
          <button onClick={() => setShowRootMenu(!showRootMenu)} className="p-1 rounded hover:bg-white/5 text-white/40 hover:text-white">
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
          {showRootMenu && (
            <div className="absolute right-0 top-full mt-1 w-36 glass-strong rounded-lg py-1 z-50">
              <button
                onClick={() => { addFile(projectId, 'new-file.tsx', null, 'file'); setShowRootMenu(false); }}
                className="w-full text-left px-3 py-1.5 text-xs text-white/70 hover:bg-white/5 flex items-center gap-2"
              >
                <FileIcon className="w-3 h-3" /> New File
              </button>
              <button
                onClick={() => { addFile(projectId, 'new-folder', null, 'folder'); setShowRootMenu(false); }}
                className="w-full text-left px-3 py-1.5 text-xs text-white/70 hover:bg-white/5 flex items-center gap-2"
              >
                <Folder className="w-3 h-3" /> New Folder
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {rootNodes.map(node => renderNode(node, 0))}
      </div>
    </div>
  );
}
