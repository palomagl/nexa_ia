import type { Project, User, FileNode, ChatMessage, Version } from '../types';

export const currentUser: User = {
  id: 'u1',
  name: 'Paloma Garcia',
  email: 'paloma@nexa.ai',
  plan: 'free',
};

export const currentWorkspace = {
  id: 'w1',
  name: 'Personal Workspace',
  plan: 'free' as const,
};

const gradients = [
  'from-nexa-600 to-violet-500',
  'from-violet-600 to-nexa-400',
  'from-nexa-500 to-violet-600',
  'from-violet-500 to-nexa-600',
  'from-nexa-700 to-violet-500',
  'from-violet-400 to-nexa-500',
  'from-nexa-500 to-violet-400',
];

function makeFiles(projectName: string): FileNode[] {
  return [
    { id: 'f1', name: 'src', type: 'folder', parentId: null, children: ['f2', 'f3', 'f4'] },
    { id: 'f2', name: 'App.tsx', type: 'file', parentId: 'f1', language: 'tsx', content: `import React from 'react';\n\nexport default function App() {\n  return (\n    <div className=\"min-h-screen bg-gray-900 text-white\">\n      <h1>${projectName}</h1>\n    </div>\n  );\n}` },
    { id: 'f3', name: 'index.css', type: 'file', parentId: 'f1', language: 'css', content: `body {\n  font-family: 'Inter', sans-serif;\n}` },
    { id: 'f4', name: 'main.tsx', type: 'file', parentId: 'f1', language: 'tsx', content: `import ReactDOM from 'react-dom/client';\nimport App from './App';\n\nReactDOM.createRoot(document.getElementById('root')!).render(<App />);` },
    { id: 'f5', name: 'components', type: 'folder', parentId: null, children: ['f6'] },
    { id: 'f6', name: 'Header.tsx', type: 'file', parentId: 'f5', language: 'tsx', content: `export function Header() {\n  return <header>NEXA</header>;\n}` },
    { id: 'f7', name: 'package.json', type: 'file', parentId: null, language: 'json', content: `{\n  "name": "${projectName.toLowerCase().replace(/\s+/g, '-')}",\n  "version": "1.0.0"\n}` },
    { id: 'f8', name: 'index.html', type: 'file', parentId: null, language: 'html', content: `<!doctype html><html><head></head><body></body></html>` },
  ];
}

function makeChat(prompt: string): ChatMessage[] {
  return [
    {
      id: 'm1',
      role: 'user',
      content: prompt,
      timestamp: new Date(Date.now() - 60000).toISOString(),
      status: 'sent',
    },
    {
      id: 'm2',
      role: 'assistant',
      content: `I've created the initial project structure based on your request. I set up the main App component, added a Header component, and configured the styling. You can now preview the result on the left. What would you like to change?`,
      timestamp: new Date(Date.now() - 30000).toISOString(),
      status: 'sent',
      actions: [
        { type: 'create_file', label: 'Created App.tsx', detail: 'Main application component' },
        { type: 'create_file', label: 'Created Header.tsx', detail: 'Reusable header component' },
        { type: 'create_file', label: 'Created index.css', detail: 'Global styles' },
      ],
    },
  ];
}

function makeVersions(files: FileNode[]): Version[] {
  const now = Date.now();
  return Array.from({ length: 5 }, (_, i) => ({
    id: `v${i}`,
    version: 12 - i,
    label: i === 0 ? 'Current' : `Version ${12 - i}`,
    timestamp: new Date(now - i * 3600000).toISOString(),
    description: i === 0 ? 'Updated login styling' : i === 1 ? 'Added dashboard page' : i === 2 ? 'Initial setup' : 'Color tweaks',
    // Dado mock: todas as versões apontam pro mesmo snapshot atual.
    filesSnapshot: files,
  }));
}

const projectDefs: Array<Partial<Project> & { name: string; description: string; type: Project['type']; prompt: string }> = [
  { name: 'Portfolio', description: 'Personal portfolio website', type: 'website', prompt: 'Create a portfolio website with projects gallery and contact form' },
  { name: 'Sistema de Estoque', description: 'Inventory management system for a stationery store', type: 'app', prompt: 'Crie um sistema de estoque para uma papelaria com login, dashboard e controle de produtos.' },
  { name: 'E-commerce', description: 'Online store with product catalog', type: 'app', prompt: 'Create an e-commerce store with product listings, cart, and checkout' },
  { name: 'DOE+ RS', description: 'Blood donation platform for Rio Grande do Sul', type: 'website', prompt: 'Plataforma de doação de sangue para o RS' },
  { name: 'Dashboard Financeiro', description: 'Financial dashboard with charts', type: 'dashboard', prompt: 'Create a financial dashboard with revenue charts and KPIs' },
  { name: 'Landing Page', description: 'SaaS landing page', type: 'website', prompt: 'Create a modern SaaS landing page with pricing and features' },
  { name: 'Sistema Escolar', description: 'School management system', type: 'app', prompt: 'Create a school management system with students, grades, and attendance' },
];

export const mockProjects: Project[] = projectDefs.map((p, i) => ({
  id: `p${i + 1}`,
  name: p.name,
  description: p.description,
  type: p.type,
  status: i === 1 ? 'building' : i === 3 ? 'live' : i === 5 ? 'error' : 'draft',
  lastModified: new Date(Date.now() - i * 86400000).toISOString(),
  createdAt: new Date(Date.now() - (i + 5) * 86400000).toISOString(),
  starred: i === 0 || i === 3,
  shared: i === 2,
  previewGradient: gradients[i % gradients.length],
  prompt: p.prompt,
  files: makeFiles(p.name),
  chat: makeChat(p.prompt),
  versions: makeVersions(makeFiles(p.name)),
  deployUrl: i === 3 ? 'https://doeplus-rs.nexa.ai' : undefined,
}));
