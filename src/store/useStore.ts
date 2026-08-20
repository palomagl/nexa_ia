import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { Project, Toast, ChatMessage, FileNode, Version, ProjectType } from '../types';
import { mockProjects, currentUser, currentWorkspace } from '../data/mockData';

interface AppState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;

  theme: 'dark' | 'light';
  toggleTheme: () => void;

  projects: Project[];
  createProject: (prompt: string, type?: ProjectType) => string;
  updateProject: (id: string, patch: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  toggleStar: (id: string) => void;
  getProject: (id: string) => Project | undefined;

  addChatMessage: (projectId: string, msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateChatMessage: (projectId: string, msgId: string, patch: Partial<ChatMessage>) => void;

  files: Record<string, FileNode[]>;
  updateFileContent: (projectId: string, fileId: string, content: string) => void;
  addFile: (projectId: string, name: string, parentId: string | null, type: 'file' | 'folder') => void;
  deleteFile: (projectId: string, fileId: string) => void;
  renameFile: (projectId: string, fileId: string, name: string) => void;

  versions: Record<string, Version[]>;
  createCheckpoint: (projectId: string, description: string) => void;

  toasts: Toast[];
  addToast: (t: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;

  commandOpen: boolean;
  setCommandOpen: (v: boolean) => void;
}

export const useStore = create<AppState>((set, get) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: v => set({ sidebarCollapsed: v }),

  theme: 'dark',
  toggleTheme: () => set(s => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

  projects: mockProjects,
  createProject: (prompt, type = 'app') => {
    const id = nanoid();
    const now = new Date().toISOString();
    const name = prompt.slice(0, 40) + (prompt.length > 40 ? '...' : 'Project');
    const newProject: Project = {
      id,
      name,
      description: prompt,
      type,
      status: 'building',
      lastModified: now,
      createdAt: now,
      starred: false,
      shared: false,
      previewGradient: 'from-nexa-600 to-violet-500',
      prompt,
      files: [
        { id: 'f1', name: 'src', type: 'folder', parentId: null, children: ['f2', 'f3'] },
        { id: 'f2', name: 'App.tsx', type: 'file', parentId: 'f1', language: 'tsx', content: `export default function App() {\n  return <div>Hello from ${name}</div>;\n}` },
        { id: 'f3', name: 'main.tsx', type: 'file', parentId: 'f1', language: 'tsx', content: 'import ReactDOM from "react-dom/client";' },
        { id: 'f4', name: 'package.json', type: 'file', parentId: null, language: 'json', content: '{}' },
      ],
      chat: [
        { id: nanoid(), role: 'user', content: prompt, timestamp: now, status: 'sent' },
        { id: nanoid(), role: 'assistant', content: 'I am setting up your project. I will create the initial structure and components based on your request.', timestamp: now, status: 'sending' },
      ],
      versions: [{ id: nanoid(), version: 1, label: 'Current', timestamp: now, description: 'Initial commit' }],
      previewHtml: `<div style="font-family:Inter,sans-serif;background:#0a0a0f;min-height:100vh;padding:48px;color:white;"><h1>Building ${name}...</h1><p>Setting up project</p></div>`,
    };
    set(s => ({ projects: [newProject, ...s.projects] }));
    return id;
  },
  updateProject: (id, patch) =>
    set(s => ({ projects: s.projects.map(p => (p.id === id ? { ...p, ...patch, lastModified: new Date().toISOString() } : p)) })),
  deleteProject: id => set(s => ({ projects: s.projects.filter(p => p.id !== id) })),
  toggleStar: id => set(s => ({ projects: s.projects.map(p => (p.id === id ? { ...p, starred: !p.starred } : p)) })),
  getProject: id => get().projects.find(p => p.id === id),

  addChatMessage: (projectId, msg) =>
    set(s => ({
      projects: s.projects.map(p =>
        p.id === projectId
          ? { ...p, chat: [...p.chat, { ...msg, id: nanoid(), timestamp: new Date().toISOString() }] }
          : p
      ),
    })),
  updateChatMessage: (projectId, msgId, patch) =>
    set(s => ({
      projects: s.projects.map(p =>
        p.id === projectId
          ? { ...p, chat: p.chat.map(m => (m.id === msgId ? { ...m, ...patch } : m)) }
          : p
      ),
    })),

  files: {},
  updateFileContent: (projectId, fileId, content) =>
    set(s => ({
      projects: s.projects.map(p =>
        p.id === projectId
          ? { ...p, files: p.files.map(f => (f.id === fileId ? { ...f, content } : f)), lastModified: new Date().toISOString() }
          : p
      ),
    })),
  addFile: (projectId, name, parentId, type) =>
    set(s => ({
      projects: s.projects.map(p => {
        if (p.id !== projectId) return p;
        const id = nanoid();
        const newFile: FileNode = { id, name, type, parentId, content: type === 'file' ? '' : undefined, children: type === 'folder' ? [] : undefined, language: type === 'file' ? name.split('.').pop() : undefined };
        const files = parentId
          ? p.files.map(f => (f.id === parentId ? { ...f, children: [...(f.children || []), id] } : f))
          : p.files;
        return { ...p, files: [...files, newFile] };
      }),
    })),
  deleteFile: (projectId, fileId) =>
    set(s => ({
      projects: s.projects.map(p => {
        if (p.id !== projectId) return p;
        const toDelete = new Set<string>([fileId]);
        let changed = true;
        while (changed) {
          changed = false;
          p.files.forEach(f => {
            if (f.parentId && toDelete.has(f.parentId) && !toDelete.has(f.id)) {
              toDelete.add(f.id);
              changed = true;
            }
          });
        }
        return { ...p, files: p.files.filter(f => !toDelete.has(f.id)) };
      }),
    })),
  renameFile: (projectId, fileId, name) =>
    set(s => ({
      projects: s.projects.map(p =>
        p.id === projectId ? { ...p, files: p.files.map(f => (f.id === fileId ? { ...f, name } : f)) } : p
      ),
    })),

  versions: {},
  createCheckpoint: (projectId, description) =>
    set(s => {
      const project = s.projects.find(p => p.id === projectId);
      if (!project) return s;
      const nextVer = (project.versions[0]?.version || 0) + 1;
      const newVersion: Version = { id: nanoid(), version: nextVer, label: 'Current', timestamp: new Date().toISOString(), description };
      const updatedVersions = [newVersion, ...project.versions.map(v => ({ ...v, label: `Version ${v.version}` }))];
      return {
        projects: s.projects.map(p => (p.id === projectId ? { ...p, versions: updatedVersions } : p)),
      };
    }),

  toasts: [],
  addToast: t => {
    const id = nanoid();
    set(s => ({ toasts: [...s.toasts, { ...t, id }] }));
    if (t.type !== 'loading') {
      setTimeout(() => get().removeToast(id), 4000);
    }
    return id;
  },
  removeToast: id => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),

  commandOpen: false,
  setCommandOpen: v => set({ commandOpen: v }),
}));
