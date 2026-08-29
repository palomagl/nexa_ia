import JSZip from 'jszip';
import type { FileNode } from '../types';
import { fullPathOf } from './fileTree';
import { buildPreviewScript, buildPreviewHtml } from './previewRuntime';

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

function buildReadme(projectName: string, filePaths: string[]): string {
  return `# ${projectName}

Gerado pelo Nexa AI.

## Como rodar

Abra **\`index.html\`** direto no navegador (duplo clique). Ele já é
autossuficiente: carrega React, ReactDOM, Babel e Tailwind via CDN e executa
todo o código do projeto — os mesmos arquivos que estão em \`src/\`, só que
concatenados num único HTML (não há bundler, então nada de \`import\`/\`export\`).

## Estrutura

\`\`\`
index.html          app pronto pra rodar (todo o código embutido)
src/
${filePaths.map(p => `  ${p}`).join('\n')}
\`\`\`

Os arquivos em \`src/\` são a fonte legível/editável. Depois de editar,
gere o HTML de novo pelo Nexa AI ou concatene os arquivos na mesma ordem.
`;
}

/**
 * Monta o .zip do projeto: um index.html autoexecutável com TODO o código
 * embutido + os arquivos-fonte soltos em src/ + um README. Devolve o Blob.
 */
export async function buildProjectZip(files: FileNode[], projectName: string): Promise<Blob> {
  const zip = new JSZip();

  const codeFiles = files.filter(f => f.type === 'file');
  const filePaths = codeFiles.map(f => fullPathOf(files, f.id));

  // 1. Arquivos-fonte, preservando a hierarquia de pastas.
  const src = zip.folder('src');
  codeFiles.forEach((f, i) => {
    src?.file(filePaths[i], f.content || '');
  });

  // 2. index.html com tudo concatenado — "o zip vira todo o código em um".
  const bundled = buildPreviewScript(files);
  zip.file('index.html', buildPreviewHtml(bundled, projectName));

  // 3. README.
  zip.file('README.md', buildReadme(projectName, filePaths));

  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}

/** Gera o .zip e dispara o download no navegador. */
export async function downloadProjectZip(files: FileNode[], projectName: string): Promise<void> {
  if (!files.some(f => f.type === 'file' && (f.content || '').trim())) {
    throw new Error('O projeto não tem código para exportar.');
  }

  const blob = await buildProjectZip(files, projectName);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slugify(projectName)}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
