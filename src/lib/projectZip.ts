import JSZip from 'jszip';
import type { FileNode, ProjectTheme } from '../types';
import { fullPathOf } from './fileTree';
import { BASE_DEPENDENCIES, TAILWIND_TOKENS, type ThemePalette } from './sandpackProject';

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'nexa-project'
  );
}

const PKG_DEV_DEPENDENCIES: Record<string, string> = {
  '@vitejs/plugin-react': '^4.3.3',
  '@types/react': '^18.3.12',
  '@types/react-dom': '^18.3.1',
  autoprefixer: '^10.4.20',
  postcss: '^8.4.49',
  tailwindcss: '^3.4.15',
  typescript: '^5.6.3',
  vite: '^5.4.11',
};

function packageJson(slug: string): string {
  return JSON.stringify(
    {
      name: slug,
      private: true,
      version: '0.1.0',
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'tsc -b && vite build',
        preview: 'vite preview',
      },
      dependencies: {
        react: '^18.3.1',
        'react-dom': '^18.3.1',
        ...BASE_DEPENDENCIES,
      },
      devDependencies: PKG_DEV_DEPENDENCIES,
    },
    null,
    2,
  );
}

const VITE_CONFIG = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
`;

const TS_CONFIG = `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
`;

const INDEX_HTML = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>__TITLE__</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

const MAIN_TSX = `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
`;

const INDEX_CSS = `@tailwind base;
@tailwind components;
@tailwind utilities;
`;

function tailwindConfig(palette?: ThemePalette): string {
  const colors = palette ? { ...TAILWIND_TOKENS, ...palette } : TAILWIND_TOKENS;
  return `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: ${JSON.stringify(colors, null, 6).replace(/\n/g, '\n      ')},
    },
  },
  plugins: [],
};
`;
}

const POSTCSS_CONFIG = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;

const VITE_ENV_DTS = `/// <reference types="vite/client" />
`;

function buildReadme(projectName: string, filePaths: string[]): string {
  return `# ${projectName}

Gerado pelo Nexa AI.

## Como rodar

\`\`\`bash
npm install
npm run dev
\`\`\`

É um projeto Vite + React + TypeScript + Tailwind normal. O código da
aplicação está em \`src/\` com \`import\`/\`export\` reais — sem nenhum runtime
especial, dá pra abrir no VS Code e continuar do jeito que quiser.

## Arquivos da aplicação

\`\`\`
${filePaths.map(p => `src/${p}`).join('\n')}
\`\`\`
`;
}

/**
 * Monta o .zip do projeto como um scaffold Vite + React + TS completo e
 * rodável: package.json, config do Vite/TS/Tailwind, index.html, src/main.tsx,
 * src/index.css e os arquivos gerados soltos em src/. Devolve o Blob.
 */
export async function buildProjectZip(
  files: FileNode[],
  projectName: string,
  theme?: ProjectTheme,
): Promise<Blob> {
  const zip = new JSZip();
  const slug = slugify(projectName);

  const codeFiles = files.filter(f => f.type === 'file');
  const filePaths = codeFiles.map(f => fullPathOf(files, f.id).replace(/^\/+/, ''));

  // Raiz do projeto.
  zip.file('package.json', packageJson(slug));
  zip.file('vite.config.ts', VITE_CONFIG);
  zip.file('tsconfig.json', TS_CONFIG);
  zip.file('index.html', INDEX_HTML.replace('__TITLE__', projectName.replace(/</g, '&lt;')));
  zip.file('tailwind.config.js', tailwindConfig(theme?.palette as ThemePalette | undefined));
  zip.file('postcss.config.js', POSTCSS_CONFIG);
  zip.file('.gitignore', 'node_modules\ndist\n');
  zip.file('README.md', buildReadme(projectName, filePaths));

  // src/ — scaffold + arquivos da aplicação.
  const src = zip.folder('src');
  src?.file('vite-env.d.ts', VITE_ENV_DTS);
  if (!filePaths.includes('main.tsx')) src?.file('main.tsx', MAIN_TSX);
  if (!filePaths.some(p => p === 'index.css')) src?.file('index.css', INDEX_CSS);
  codeFiles.forEach((f, i) => {
    src?.file(filePaths[i], f.content || '');
  });

  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}

/** Gera o .zip e dispara o download no navegador. */
export async function downloadProjectZip(
  files: FileNode[],
  projectName: string,
  theme?: ProjectTheme,
): Promise<void> {
  if (!files.some(f => f.type === 'file' && (f.content || '').trim())) {
    throw new Error('O projeto não tem código para exportar.');
  }

  const blob = await buildProjectZip(files, projectName, theme);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slugify(projectName)}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
