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
  'from-lavender to-lavender-deep',
  'from-sage to-sage-deep',
  'from-rose to-rose-deep',
  'from-lavender-deep to-lavender',
  'from-sage-deep to-sage',
  'from-rose-deep to-rose',
  'from-lavender to-sage',
];

// Arquivos de demonstração no MESMO formato que o gerador de verdade
// produz — React + TypeScript padrão, com import/export reais — pra o Preview
// (Sandpack) renderizar o mock exatamente como renderiza um projeto real.
function makeFiles(projectName: string): FileNode[] {
  return [
    {
      id: 'f1',
      name: 'App.tsx',
      type: 'file',
      parentId: null,
      language: 'tsx',
      content: `import Header from './components/Header';\n\nexport default function App() {\n  return (\n    <div className="min-h-screen bg-slate-950 text-white">\n      <Header title="${projectName}" />\n      <main className="max-w-3xl mx-auto px-6 py-16">\n        <h1 className="text-3xl font-bold">${projectName}</h1>\n        <p className="mt-3 text-white/60">Projeto de demonstração gerado pelo Nexa AI.</p>\n      </main>\n    </div>\n  );\n}\n`,
    },
    { id: 'f2', name: 'components', type: 'folder', parentId: null, children: ['f3'] },
    {
      id: 'f3',
      name: 'Header.tsx',
      type: 'file',
      parentId: 'f2',
      language: 'tsx',
      content: `type HeaderProps = { title: string };\n\nexport default function Header({ title }: HeaderProps) {\n  return (\n    <header className="border-b border-white/10 px-6 py-4 text-sm font-semibold tracking-tight">\n      {title}\n    </header>\n  );\n}\n`,
    },
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
}));
