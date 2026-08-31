export type ProjectType = 'website' | 'app' | 'dashboard' | 'prototype';
export type ProjectStatus = 'draft' | 'building' | 'live' | 'error';
export type PreviewDevice = 'desktop' | 'tablet' | 'mobile';
export type FileNodeType = 'file' | 'folder';
// Tons de roxo trocáveis — ver src/index.css ([data-accent]) e tailwind.config.js
export type AccentColor = 'roxo' | 'violeta' | 'ameixa' | 'profundo';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  plan: 'free' | 'pro' | 'team';
}

export interface Workspace {
  id: string;
  name: string;
  plan: 'free' | 'pro' | 'team';
}

export interface FileNode {
  id: string;
  name: string;
  type: FileNodeType;
  parentId: string | null;
  content?: string;
  language?: string;
  children?: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  status?: 'sending' | 'sent' | 'error';
  actions?: ChatAction[];
}

export interface ChatAction {
  type: 'create_file' | 'edit_file' | 'delete_file';
  label: string;
  detail: string;
}

export interface Version {
  id: string;
  version: number;
  label: string;
  timestamp: string;
  description: string;
  // Foto dos arquivos do projeto no momento do checkpoint — permite
  // restaurar de verdade, não só decorativo.
  filesSnapshot: FileNode[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  type: ProjectType;
  status: ProjectStatus;
  lastModified: string;
  createdAt: string;
  starred: boolean;
  shared: boolean;
  previewGradient: string;
  prompt: string;
  files: FileNode[];
  chat: ChatMessage[];
  versions: Version[];
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'loading';
  title: string;
  message?: string;
}
