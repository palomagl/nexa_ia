import type { FileNode } from '../types';
import { fullPathOf } from './fileTree';

/**
 * Adaptador entre a árvore de arquivos do projeto (FileNode[]) e o formato
 * que o Sandpack espera: um mapa plano `caminho -> { code }`.
 *
 * Usamos o bundler CLÁSSICO do Sandpack (template "react-ts"), que roda num
 * iframe hospedado (sandpack-bundler.codesandbox.io) e resolve os imports +
 * node_modules por CDN. NÃO usamos o template "vite-react-ts": ele sobe um
 * Vite de verdade dentro do navegador (nodebox), que exige headers de
 * cross-origin isolation (COOP/COEP) na página host — sem eles o preview
 * fica carregando pra sempre.
 *
 * Convenção do template clássico: arquivos na RAIZ (/App.tsx,
 * /components/Header.tsx), entrada em /index.tsx, HTML em /public/index.html.
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

/** Paleta de um tema curado (server/themes.js) — mesmas chaves de
 *  TAILWIND_TOKENS, sobrescreve o neutro padrão quando o projeto tem tema. */
export type ThemePalette = Partial<Record<keyof typeof TAILWIND_TOKENS, unknown>>;
export type ThemeFonts = { display?: string; body?: string };
export interface ThemeInput {
  palette?: ThemePalette;
  fonts?: ThemeFonts;
}

export function mergeTokens(palette?: ThemePalette) {
  return palette ? { ...TAILWIND_TOKENS, ...palette } : TAILWIND_TOKENS;
}

/** URL do Google Fonts pras 1-2 famílias do tema (Fredoka fica de fallback). */
export function googleFontsHref(fonts?: ThemeFonts): string {
  const fams = [fonts?.display, fonts?.body]
    .filter((f): f is string => !!f)
    .filter((f, i, a) => a.indexOf(f) === i)
    .map(f => `family=${f.trim().replace(/\s+/g, '+')}:wght@400;500;600;700`);
  return `https://fonts.googleapis.com/css2?${fams.join('&')}&display=swap`;
}

/** Config de fontFamily do Tailwind: font-display / font-body / font-sans. */
export function fontFamilyConfig(fonts?: ThemeFonts) {
  const body = fonts?.body || 'Inter';
  const display = fonts?.display || body;
  const sys = ['ui-sans-serif', 'system-ui', 'sans-serif'];
  return {
    sans: [body, ...sys],
    body: [body, ...sys],
    display: [display, ...sys],
  };
}

function buildPreviewIndexHtml(theme?: ThemeInput): string {
  const colors = mergeTokens(theme?.palette);
  const fontFamily = fontFamilyConfig(theme?.fonts);
  const bodyStack = fontFamily.body.map(f => (/\s/.test(f) ? `'${f}'` : f)).join(', ');
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Preview</title>
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="${googleFontsHref(theme?.fonts)}" />
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = { theme: { extend: { colors: ${JSON.stringify(colors)}, fontFamily: ${JSON.stringify(fontFamily)} } } };
    </script>
    <style>
      html, body, #root { margin: 0; padding: 0; min-height: 100%; }
      body { font-family: ${bodyStack}; }
    </style>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;
}

const PREVIEW_ENTRY_TSX = `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

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

/** Caminho de entrada do template clássico. */
export const SANDPACK_ENTRY = '/index.tsx';

function hasAppFile(map: SandpackFileMap): boolean {
  return Object.keys(map).some(p => /^\/App\.(t|j)sx?$/.test(p));
}

/**
 * Converte os arquivos do projeto para o mapa do Sandpack (template clássico
 * "react-ts"): arquivos na raiz, entrada /index.tsx, HTML /public/index.html
 * com Tailwind via CDN + fontes do tema.
 */
export function filesToSandpack(files: FileNode[], theme?: ThemeInput): {
  files: SandpackFileMap;
  dependencies: Record<string, string>;
} {
  const map: SandpackFileMap = {};

  for (const node of files) {
    if (node.type !== 'file') continue;
    const rel = fullPathOf(files, node.id).replace(/^\/+/, '');
    map[`/${rel}`] = { code: node.content ?? '' };
  }

  map['/public/index.html'] = { code: buildPreviewIndexHtml(theme) };
  map[SANDPACK_ENTRY] = { code: PREVIEW_ENTRY_TSX };

  if (!hasAppFile(map)) {
    map['/App.tsx'] = { code: FALLBACK_APP };
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
