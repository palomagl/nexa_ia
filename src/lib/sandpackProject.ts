import type { FileNode } from '../types';
import { fullPathOf } from './fileTree';

/**
 * Adaptador entre a árvore de arquivos do projeto (FileNode[]) e o formato
 * que o Sandpack espera: um mapa plano `caminho -> { code }`, com um scaffold
 * mínimo de Vite + React + TS por cima. O código gerado agora é React + TS
 * padrão (import/export normais), então o Sandpack empacota de verdade — não
 * há mais concatenação em escopo global nem Babel na mão.
 */

export type SandpackFileMap = Record<string, { code: string }>;

/** Dependências sempre disponíveis para o código gerado. Mantido em sincronia
 *  com o contrato de geração do servidor (server/uiKit.js UI_KIT_DEPENDENCIES). */
export const BASE_DEPENDENCIES: Record<string, string> = {
  'lucide-react': '^0.456.0',
  'class-variance-authority': '^0.7.1',
  clsx: '^2.1.1',
  'tailwind-merge': '^2.5.4',
};

/**
 * Tokens semânticos (estilo shadcn, mas com valores hex diretos — o Tailwind
 * Play CDN do preview não roda CSS vars/plugins). O Nexa UI kit usa
 * bg-primary, text-muted-foreground, border-border, etc. A Fase 4 troca
 * esses valores por tema; aqui fica o neutro padrão (zinc + violeta).
 */
export const TAILWIND_TOKENS = {
  border: '#e4e4e7',
  input: '#e4e4e7',
  ring: '#8b5cf6',
  background: '#ffffff',
  foreground: '#0a0a0a',
  primary: { DEFAULT: '#6d28d9', foreground: '#ffffff' },
  secondary: { DEFAULT: '#f4f4f5', foreground: '#18181b' },
  destructive: { DEFAULT: '#dc2626', foreground: '#ffffff' },
  muted: { DEFAULT: '#f4f4f5', foreground: '#71717a' },
  accent: { DEFAULT: '#ede9fe', foreground: '#4c1d95' },
  card: { DEFAULT: '#ffffff', foreground: '#0a0a0a' },
  popover: { DEFAULT: '#ffffff', foreground: '#0a0a0a' },
} as const;

const PREVIEW_INDEX_HTML = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Preview</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = { theme: { extend: { colors: ${JSON.stringify(TAILWIND_TOKENS)} } } };
    </script>
    <style>
      html, body, #root { margin: 0; padding: 0; min-height: 100%; }
      body { font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;

const PREVIEW_MAIN_TSX = `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const el = document.getElementById('root');
if (el) {
  createRoot(el).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
`;

const FALLBACK_APP = `export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-slate-500">
      <p>Este projeto ainda não tem um App.tsx.</p>
    </div>
  );
}
`;

/** Nome de arquivo de entrada do projeto, se existir. */
function findAppPath(map: SandpackFileMap): string | null {
  return (
    Object.keys(map).find(p => /\/src\/App\.(t|j)sx?$/.test(p)) ?? null
  );
}

/**
 * Converte os arquivos do projeto para o mapa do Sandpack, injetando o
 * scaffold (index.html com Tailwind via CDN, src/main.tsx, src/index.css).
 */
export function filesToSandpack(files: FileNode[]): {
  files: SandpackFileMap;
  dependencies: Record<string, string>;
} {
  const map: SandpackFileMap = {};

  for (const node of files) {
    if (node.type !== 'file') continue;
    const rel = fullPathOf(files, node.id).replace(/^\/+/, '');
    map[`/src/${rel}`] = { code: node.content ?? '' };
  }

  map['/index.html'] = { code: PREVIEW_INDEX_HTML };
  map['/src/main.tsx'] = { code: PREVIEW_MAIN_TSX };
  if (!map['/src/index.css']) map['/src/index.css'] = { code: '' };

  if (!findAppPath(map)) {
    map['/src/App.tsx'] = { code: FALLBACK_APP };
  }

  return { files: map, dependencies: { ...BASE_DEPENDENCIES } };
}

/** Hash barato e estável do conteúdo — usado como `key` do <SandpackProvider>
 *  pra forçar recarga quando qualquer arquivo muda. */
export function bundleKey(files: FileNode[]): string {
  let hash = 0;
  let len = 0;
  for (const node of files) {
    if (node.type !== 'file') continue;
    const value = (node.name || '') + ' ' + (node.content || '');
    len += value.length;
    for (let i = 0; i < value.length; i += 1) {
      hash = (Math.imul(31, hash) + value.charCodeAt(i)) | 0;
    }
  }
  return `${len}:${hash}`;
}

/**
 * Detecta se um projeto já está no formato "módulo padrão" (import/export).
 * Serve de guarda durante a migração — projetos ainda no formato antigo
 * (escopo global, `function App()` sem export) não rodariam no Sandpack.
 * Depois que todos os projetos/mocks forem convertidos, isso vira sempre true.
 */
export function isModuleStyle(files: FileNode[]): boolean {
  const app = files.find(
    f => f.type === 'file' && /(^|\/)App\.(t|j)sx?$/.test(f.name),
  );
  const source = app?.content ?? '';
  return /\bexport\s+(default|function|const)\b/.test(source) || /^\s*import\s/m.test(source);
}
