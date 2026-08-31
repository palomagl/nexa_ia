import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { Project, Toast, ChatMessage, FileNode, Version, ProjectType, ProjectTheme, User, Workspace } from '../types';
import { mockProjects, currentUser, currentWorkspace } from '../data/mockData';
import { buildFileNodes, upsertFileByPath, removeFileByPath, type GeneratedFile } from '../lib/fileTree';

interface AppState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  user: User;
  updateUser: (patch: Partial<Pick<User, 'name' | 'email'>>) => void;

  workspace: Workspace;
  updateWorkspace: (patch: Partial<Pick<Workspace, 'name'>>) => void;

  projects: Project[];
  // generatedFiles: lista de arquivos vindos da IA (App.tsx + possíveis
  // components/*.tsx). Cada um vira um FileNode real na árvore do projeto.
  createProject: (prompt: string, type?: ProjectType, generatedFiles?: GeneratedFile[], explanation?: string, theme?: ProjectTheme) => string;
  updateProject: (id: string, patch: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  toggleStar: (id: string) => void;
  getProject: (id: string) => Project | undefined;

  addChatMessage: (projectId: string, msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;

  updateFileContent: (projectId: string, fileId: string, content: string) => void;
  addFile: (projectId: string, name: string, parentId: string | null, type: 'file' | 'folder') => void;
  deleteFile: (projectId: string, fileId: string) => void;

  // Edição incremental orientada por caminho (usada pela IA no chat): cria
  // ou atualiza um único arquivo pelo seu caminho ("components/Header.tsx"),
  // criando pastas intermediárias automaticamente quando necessário.
  applyGeneratedFile: (projectId: string, path: string, content: string) => void;
  removeGeneratedFile: (projectId: string, path: string) => void;

  createCheckpoint: (projectId: string, description: string) => void;
  restoreVersion: (projectId: string, versionId: string) => void;

  toasts: Toast[];
  addToast: (t: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;

  commandOpen: boolean;
  setCommandOpen: (v: boolean) => void;
}

export const useStore = create<AppState>((set, get) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  user: currentUser,
  updateUser: patch => set(s => ({ user: { ...s.user, ...patch } })),

  workspace: currentWorkspace,
  updateWorkspace: patch => set(s => ({ workspace: { ...s.workspace, ...patch } })),

  projects: mockProjects,
  createProject: (prompt, type = 'app', generatedFiles, explanation, theme) => {
    const id = nanoid();
    const now = new Date().toISOString();
    const name = prompt.length > 40 ? prompt.slice(0, 40).trimEnd() + '…' : prompt;

    // Usa os arquivos gerados pela IA (pode ser só App.tsx, ou App.tsx +
    // vários components/*.tsx) ou um fallback de uma página se não vier nada.
    const files = generatedFiles && generatedFiles.length > 0
      ? buildFileNodes(generatedFiles)
      : buildFileNodes([{
          name: 'App.tsx',
          content: `export default function App() {\n  return (\n    <div className="p-8 bg-slate-950 text-white min-h-screen">\n      <h1 className="text-2xl font-bold">${prompt}</h1>\n    </div>\n  );\n}\n`,
        }]);

    const newProject: Project = {
      id,
      name,
      description: prompt,
      type,
      status: 'live', // Muda de 'building' para 'live' para destravar a tela imediatamente!
      lastModified: now,
      createdAt: now,
      starred: false,
      shared: false,
      previewGradient: 'from-lavender to-lavender-deep',
      prompt,
      theme,
      files,
      chat: [
        { id: nanoid(), role: 'user', content: prompt, timestamp: now, status: 'sent' },
        { 
          id: nanoid(), 
          role: 'assistant', 
          // Se recebeu a explicação do servidor, exibe ela no chat. Senão, usa a padrão.
          content: explanation || 'Projeto gerado e conectado com sucesso ao Gemini!', 
          timestamp: now, 
          status: 'sent' 
        },
      ],
      versions: [{ id: nanoid(), version: 1, label: 'Current', timestamp: now, description: 'Initial commit', filesSnapshot: files }],
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
  applyGeneratedFile: (projectId, path, content) =>
    set(s => ({
      projects: s.projects.map(p =>
        p.id === projectId
          ? { ...p, files: upsertFileByPath(p.files, path, content), lastModified: new Date().toISOString() }
          : p
      ),
    })),
  removeGeneratedFile: (projectId, path) =>
    set(s => ({
      projects: s.projects.map(p =>
        p.id === projectId
          ? { ...p, files: removeFileByPath(p.files, path), lastModified: new Date().toISOString() }
          : p
      ),
    })),

  createCheckpoint: (projectId, description) =>
    set(s => {
      const project = s.projects.find(p => p.id === projectId);
      if (!project) return s;
      const nextVer = (project.versions[0]?.version || 0) + 1;
      const newVersion: Version = {
        id: nanoid(),
        version: nextVer,
        label: 'Current',
        timestamp: new Date().toISOString(),
        description,
        filesSnapshot: project.files,
      };
      const updatedVersions = [newVersion, ...project.versions.map(v => ({ ...v, label: `Version ${v.version}` }))];
      return {
        projects: s.projects.map(p => (p.id === projectId ? { ...p, versions: updatedVersions } : p)),
      };
    }),
  restoreVersion: (projectId, versionId) =>
    set(s => {
      const project = s.projects.find(p => p.id === projectId);
      const target = project?.versions.find(v => v.id === versionId);
      if (!project || !target) return s;

      // Restaurar cria um NOVO checkpoint com os arquivos de volta ao
      // estado antigo — como um "revert" de verdade, sem apagar histórico.
      const nextVer = (project.versions[0]?.version || 0) + 1;
      const revertVersion: Version = {
        id: nanoid(),
        version: nextVer,
        label: 'Current',
        timestamp: new Date().toISOString(),
        description: `Restaurado para "${target.label}"`,
        filesSnapshot: target.filesSnapshot,
      };
      const updatedVersions = [revertVersion, ...project.versions.map(v => ({ ...v, label: `Version ${v.version}` }))];

      return {
        projects: s.projects.map(p =>
          p.id === projectId
            ? { ...p, files: target.filesSnapshot, versions: updatedVersions, lastModified: new Date().toISOString() }
            : p
        ),
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