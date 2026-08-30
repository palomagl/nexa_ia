import { useMemo } from 'react';
import {
  SandpackProvider,
  SandpackPreview,
  type SandpackFiles,
} from '@codesandbox/sandpack-react';
// Sandpack 2.x injeta o próprio CSS em runtime (via @stitches/core) — não há
// folha de estilo separada pra importar.

import type { FileNode } from '../../types';
import { filesToSandpack, bundleKey } from '../../lib/sandpackProject';

interface Props {
  files: FileNode[];
  /** Muda esse valor pra forçar um recarregamento limpo do bundler. */
  refreshToken?: number;
}

/**
 * Runtime do Preview: empacota os arquivos do projeto com o bundler do
 * Sandpack (Vite + React + TS) e mostra só o resultado renderizado. Sem
 * editor, sem abas — o chrome (device, refresh, download) fica no Preview.tsx.
 */
export function SandpackRuntime({ files, refreshToken = 0 }: Props) {
  const { files: sandpackFiles, dependencies } = useMemo(
    () => filesToSandpack(files),
    [files],
  );

  const key = `${refreshToken}:${useMemo(() => bundleKey(files), [files])}`;

  return (
    <SandpackProvider
      key={key}
      template="vite-react-ts"
      theme="light"
      files={sandpackFiles as SandpackFiles}
      customSetup={{ dependencies }}
      options={{
        recompileMode: 'delayed',
        recompileDelay: 400,
        classes: { 'sp-wrapper': 'h-full', 'sp-layout': 'h-full' },
      }}
      style={{ height: '100%' }}
    >
      <SandpackPreview
        showOpenInCodeSandbox={false}
        showRefreshButton={false}
        showRestartButton={false}
        showSandpackErrorOverlay
        style={{ height: '100%' }}
      />
    </SandpackProvider>
  );
}
