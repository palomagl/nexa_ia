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
 *  com o contrato de geração do servidor. As libs do shadcn/ui entram aqui. */
export const BASE_DEPENDENCIES: Record<string, string> = {
  'lucide-react': '^0.456.0',
};

const PREVIEW_INDEX_HTML = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Preview</title>
    <script src="https://cdn.tailwindcss.com"></script>
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
