import { nanoid } from 'nanoid';
import type { FileNode } from '../types';

/** Um arquivo "achatado" como a IA devolve: nome/caminho + conteúdo. */
export interface GeneratedFile {
  name: string; // ex.: "App.tsx" ou "components/Header.tsx"
  content: string;
}

function extToLanguage(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (ext === 'tsx' || ext === 'jsx') return 'tsx';
  if (ext === 'ts') return 'ts';
  if (ext === 'js' || ext === 'mjs') return 'js';
  if (ext === 'css') return 'css';
  if (ext === 'json') return 'json';
  return ext || 'text';
}

function normalizePath(path: string): string[] {
  return path
    .replace(/^\.?\/+/, '')
    .split('/')
    .map(s => s.trim())
    .filter(Boolean);
}

/** Resolve um arquivo pelo caminho completo ("components/Header.tsx"),
 * andando pela árvore pasta por pasta. */
export function findNodeByPath(files: FileNode[], path: string): FileNode | undefined {
  const segments = normalizePath(path);
  if (segments.length === 0) return undefined;

  let parentId: string | null = null;
  let node: FileNode | undefined;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const isLast = i === segments.length - 1;
    node = files.find(
      f => f.parentId === parentId && f.name === seg && (isLast ? f.type === 'file' : f.type === 'folder')
    );
    if (!node) return undefined;
    parentId = node.id;
  }

  return node;
}

function ensureFolders(
  files: FileNode[],
  segments: string[]
): { files: FileNode[]; parentId: string | null } {
  let current = files;
  let parentId: string | null = null;

  for (const seg of segments) {
    let folder = current.find(f => f.parentId === parentId && f.name === seg && f.type === 'folder');

    if (!folder) {
      const id = nanoid();
      folder = { id, name: seg, type: 'folder', parentId, children: [] };
      current = current.map(f =>
        f.id === parentId ? { ...f, children: [...(f.children || []), id] } : f
      );
      current = [...current, folder];
    }

    parentId = folder.id;
  }

  return { files: current, parentId };
}

/**
 * Cria (ou atualiza, se já existir) um arquivo no caminho indicado, criando
 * automaticamente as pastas intermediárias que faltarem. Retorna um NOVO
 * array de arquivos (imutável, para uso direto em `set` do Zustand).
 */
export function upsertFileByPath(files: FileNode[], path: string, content: string): FileNode[] {
  const segments = normalizePath(path);
  if (segments.length === 0) return files;

  const leafName = segments[segments.length - 1];
  const folderSegments = segments.slice(0, -1);

  const existing = findNodeByPath(files, path);
  if (existing) {
    return files.map(f => (f.id === existing.id ? { ...f, content } : f));
  }

  const { files: withFolders, parentId } = ensureFolders(files, folderSegments);
  const id = nanoid();
  const newFile: FileNode = {
    id,
    name: leafName,
    type: 'file',
    parentId,
    content,
    language: extToLanguage(leafName),
  };

  const attached = parentId
    ? withFolders.map(f => (f.id === parentId ? { ...f, children: [...(f.children || []), id] } : f))
    : withFolders;

  return [...attached, newFile];
}

/** Monta uma árvore de arquivos do zero a partir de uma lista achatada. */
export function buildFileNodes(generatedFiles: GeneratedFile[]): FileNode[] {
  let files: FileNode[] = [];
  for (const gf of generatedFiles) {
    if (!gf?.name) continue;
    files = upsertFileByPath(files, gf.name, gf.content ?? '');
  }
  return files;
}

/** Remove o arquivo no caminho indicado (só o arquivo folha, sem podar
 * pastas que ficarem vazias — inofensivo, elas só não aparecem com filhos). */
export function removeFileByPath(files: FileNode[], path: string): FileNode[] {
  const existing = findNodeByPath(files, path);
  if (!existing) return files;

  const withoutFile = files.filter(f => f.id !== existing.id);

  return withoutFile.map(f =>
    f.id === existing.parentId
      ? { ...f, children: (f.children || []).filter(cid => cid !== existing.id) }
      : f
  );
}

/** Caminho completo de um nó (para exibir/combinar com o que a IA espera),
 * reconstruído subindo pela cadeia de parentId. */
export function fullPathOf(files: FileNode[], nodeId: string): string {
  const byId = new Map(files.map(f => [f.id, f]));
  const parts: string[] = [];
  let current = byId.get(nodeId);

  while (current) {
    parts.unshift(current.name);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }

  return parts.join('/');
}
