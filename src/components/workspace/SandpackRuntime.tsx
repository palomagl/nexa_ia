import { useMemo } from 'react';
import {
  SandpackProvider,
  SandpackPreview,
  type SandpackFiles,
} from '@codesandbox/sandpack-react';
// Sandpack 2.x injeta o próprio CSS em runtime (via @stitches/core) — não há
// folha de estilo separada pra importar.

import type { FileNode, ProjectTheme } from '../../types';
import { filesToSandpack, bundleKey, SANDPACK_ENTRY, type ThemeInput } from '../../lib/sandpackProject';

interface Props {
  files: FileNode[];
  theme?: ProjectTheme;
  /** Muda esse valor pra forçar um recarregamento limpo do bundler. */
  refreshToken?: number;
}

/**
 * Runtime do Preview: empacota os arquivos do projeto com o bundler clássico
 * do Sandpack (hospedado) e mostra só o resultado renderizado. Sem editor,
 * sem abas — o chrome (device, refresh, download) fica no Preview.tsx.
 */
export function SandpackRuntime({ files, theme, refreshToken = 0 }: Props) {
  const themeInput = useMemo<ThemeInput | undefined>(
    () => (theme ? { palette: theme.palette, fonts: theme.fonts } : undefined),
    [theme],
  );

  const { files: sandpackFiles, dependencies } = useMemo(
    () => filesToSandpack(files, themeInput),
    [files, themeInput],
  );

  const contentKey = useMemo(() => bundleKey(files), [files]);
  const key = `${refreshToken}:${theme?.id ?? 'none'}:${contentKey}`;

  return (
    <SandpackProvider
      key={key}
      template="react-ts"
      theme="light"
      files={sandpackFiles as SandpackFiles}
      customSetup={{ entry: SANDPACK_ENTRY, dependencies }}
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
