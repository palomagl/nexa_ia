import { lazy, Suspense, useState } from 'react';

import {
  Monitor,
  Tablet,
  Smartphone,
  RefreshCw,
  Download,
} from 'lucide-react';

import type { FileNode, PreviewDevice } from '../../types';
import { cn } from '../../lib/utils';
import { useStore } from '../../store/useStore';
import { downloadProjectZip } from '../../lib/projectZip';

// Sandpack traz ~1MB (CodeMirror, cliente do bundler). Só carrega quando um
// Preview de fato monta — não pesa nas telas de navegação.
const SandpackRuntime = lazy(() =>
  import('./SandpackRuntime').then(m => ({ default: m.SandpackRuntime })),
);

interface Props {
  files: FileNode[];
  projectName: string;
}

export function Preview({ files, projectName }: Props) {
  const addToast = useStore(s => s.addToast);
  const [device, setDevice] = useState<PreviewDevice>('desktop');
  const [refreshToken, setRefreshToken] = useState(0);
  const [downloading, setDownloading] = useState(false);

  const sizes: Record<PreviewDevice, { width: string; height: string }> = {
    desktop: { width: '100%', height: '100%' },
    tablet: { width: '768px', height: '1024px' },
    mobile: { width: '375px', height: '667px' },
  };

  const devices: { id: PreviewDevice; icon: typeof Monitor; label: string }[] = [
    { id: 'desktop', icon: Monitor, label: 'Desktop' },
    { id: 'tablet', icon: Tablet, label: 'Tablet' },
    { id: 'mobile', icon: Smartphone, label: 'Mobile' },
  ];

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadProjectZip(files, projectName);
      addToast({
        type: 'success',
        title: 'Projeto exportado',
        message: 'O .zip é um projeto Vite — rode npm install && npm run dev.',
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Não foi possível exportar',
        message: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-paper-line">
        <div className="flex items-center gap-1">
          {devices.map((d) => {
            const Icon = d.icon;

            return (
              <button
                key={d.id}
                onClick={() => setDevice(d.id)}
                className={cn(
                  'p-2 rounded-lg transition-all',
                  device === d.id
                    ? 'bg-lavender-soft text-lavender-ink'
                    : 'text-ink/55 hover:text-ink hover:bg-ink/[0.05]'
                )}
                title={d.label}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-paper-card border border-paper-line2 text-xs text-ink/55">
            <div className="w-1.5 h-1.5 rounded-full bg-sage-deep" />
            <span className="truncate max-w-[160px]">nexa.ai/{projectName.toLowerCase().replace(/\s+/g, '-')}</span>
          </div>

          <button
            onClick={() => setRefreshToken((k) => k + 1)}
            className="p-2 rounded-lg text-ink/55 hover:text-ink hover:bg-ink/[0.05] transition-all"
            title="Recarregar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="p-2 rounded-lg text-ink/55 hover:text-ink hover:bg-ink/[0.05] transition-all disabled:opacity-40"
            title="Baixar projeto (.zip)"
          >
            <Download className={cn('w-4 h-4', downloading && 'animate-pulse')} />
          </button>
        </div>
      </div>

      <div className="flex-1 bg-paper overflow-auto flex items-start justify-center p-4">
        <div
          className={cn(
            'bg-white rounded-lg shadow-paper-lg overflow-hidden transition-all duration-300',
            device !== 'desktop' && 'border border-paper-line2'
          )}
          style={{
            width: sizes[device].width,
            height: sizes[device].height,
            maxWidth: '100%',
          }}
        >
          <Suspense
            fallback={
              <div className="h-full w-full flex items-center justify-center bg-white text-sm text-slate-400">
                carregando preview…
              </div>
            }
          >
            <SandpackRuntime files={files} refreshToken={refreshToken} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
