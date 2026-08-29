import type { FileNode } from '../types';

/**
 * Runtime do Preview — compartilhado entre o <iframe> do editor (Preview.tsx)
 * e o export .zip (projectZip.ts), pra os dois rodarem o código gerado
 * exatamente do mesmo jeito: sem bundler, tudo concatenado no mesmo escopo
 * global, React/ReactDOM/Babel/Tailwind via CDN.
 */

export function preparePreviewCode(source: string): string {
  let code = source || '';

  code = code.replace(/^﻿/, '').trim();

  if (code.startsWith('```')) {
    code = code.replace(/^```(?:tsx|jsx|javascript|js|typescript|ts)?\s*/i, '');
    code = code.replace(/\s*```$/, '');
  }

  code = code.replace(
    /\bimport\s+(?:type\s+)?[\s\S]*?from\s+['"][^'"]+['"]\s*;?/g,
    ''
  );
  code = code.replace(/\bimport\s+['"][^'"]+['"]\s*;?/g, '');

  code = code.replace(/\bexport\s+default\s+/g, '');
  code = code.replace(/^\s*export\s+\{[^}]*\}\s*;?\s*$/gm, '');
  code = code.replace(/^\s*export\s+/gm, '');

  return code.trim();
}

export const PREVIEWABLE_LANGUAGES = new Set(['tsx', 'jsx', 'ts', 'js']);

/**
 * Concatena todos os arquivos de código do projeto num único script — não
 * existe bundler no runtime do Preview, então todo arquivo roda no MESMO
 * escopo global (sem import/export). App.tsx vem por último só por clareza;
 * como são todas "function Nome() {...}", a ordem não importa de verdade
 * (declarações de função são hoisted).
 */
export function buildPreviewScript(files: FileNode[]): string {
  const codeFiles = files.filter(
    f => f.type === 'file' && (!f.language || PREVIEWABLE_LANGUAGES.has(f.language))
  );

  const appFile = codeFiles.find(f => f.name === 'App.tsx');
  const otherFiles = codeFiles.filter(f => f !== appFile);
  const ordered = appFile ? [...otherFiles, appFile] : codeFiles;

  return ordered
    .map(f => `// ---- ${f.name} ----\n${preparePreviewCode(f.content || '')}`)
    .join('\n\n');
}

export function contentKey(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (Math.imul(31, hash) + value.charCodeAt(i)) | 0;
  }
  return `${value.length}:${hash}`;
}

/** HTML completo e autossuficiente que executa `previewCode`. Usado tanto no
 *  srcDoc do <iframe> quanto como index.html do .zip exportado. */
export function buildPreviewHtml(previewCode: string, title = 'Preview'): string {
  const sourceLiteral = JSON.stringify(previewCode);

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title.replace(/</g, '&lt;')}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {}
      }
    };
  </script>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    * { box-sizing: border-box; }
    html, body, #root {
      margin: 0;
      padding: 0;
      width: 100%;
      min-height: 100%;
    }
    body {
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    const sourceCode = ${sourceLiteral};

    function showError(error) {
      const message = (error && (error.stack || error.message)) ? (error.stack || error.message) : String(error);
      const root = document.getElementById('root');
      if (!root) return;
      root.innerHTML = \`
        <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px;background:#0f172a;color:white;font-family:system-ui,sans-serif;">
          <div style="max-width:700px;width:100%;background:#1e293b;border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:24px;">
            <h2 style="margin:0 0 12px;color:#f87171;">Erro ao executar o projeto</h2>
            <pre style="white-space:pre-wrap;color:#cbd5e1;font-size:13px;line-height:1.6;">\${message}</pre>
          </div>
        </div>
      \`;
    }

    try {
      if (!sourceCode.trim()) {
        throw new Error('Nenhum código encontrado nos arquivos do projeto.');
      }

      if (typeof Babel === 'undefined' || typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
        throw new Error('O runtime do Preview não carregou (React, ReactDOM ou Babel). Verifique a conexão com a CDN.');
      }

      const transformed = Babel.transform(sourceCode, {
        presets: [
          ['react', { runtime: 'classic' }]
        ],
        filename: 'App.jsx'
      }).code;

      const execute = new Function(
        'React',
        'ReactDOM',
        'useState',
        'useEffect',
        'useMemo',
        'useCallback',
        'useRef',
        'useReducer',
        'useContext',
        'useId',
        'Fragment',
        transformed +
          '\\n; return (typeof App !== "undefined") ? App : null;'
      );

      const AppComponent = execute(
        window.React,
        window.ReactDOM,
        window.React.useState,
        window.React.useEffect,
        window.React.useMemo,
        window.React.useCallback,
        window.React.useRef,
        window.React.useReducer,
        window.React.useContext,
        window.React.useId,
        window.React.Fragment
      );

      if (typeof AppComponent !== 'function') {
        throw new Error('O código gerado não possui um componente App válido. Declare function App() { ... }');
      }

      const rootEl = document.getElementById('root');
      const root = ReactDOM.createRoot(rootEl);
      root.render(React.createElement(AppComponent));
    } catch (error) {
      console.error(error);
      showError(error);
    }
  </script>
</body>
</html>`;
}
