import { useMemo, useState } from 'react';

import {
  Monitor,
  Tablet,
  Smartphone,
  RefreshCw,
  ExternalLink,
  Download,
} from 'lucide-react';

import type { FileNode, PreviewDevice } from '../../types';
import { cn } from '../../lib/utils';
import { useStore } from '../../store/useStore';
import { buildPreviewScript, buildPreviewHtml, contentKey } from '../../lib/previewRuntime';
import { downloadProjectZip } from '../../lib/projectZip';

interface Props {
  files: FileNode[];
  projectName: string;
}

export function Preview({ files, projectName }: Props) {
  const addToast = useStore(s => s.addToast);
  const [device, setDevice] = useState<PreviewDevice>('desktop');
  const [refreshKey, setRefreshKey] = useState(0);
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

  const previewCode = useMemo(() => buildPreviewScript(files), [files]);
  const srcDoc = useMemo(() => buildPreviewHtml(previewCode, projectName), [previewCode, projectName]);
  const iframeKey = `${refreshKey}:${contentKey(previewCode)}`;

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadProjectZip(files, projectName);
      addToast({ type: 'success', title: 'Projeto exportado', message: 'O .zip foi baixado — abra o index.html.' });
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
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
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
                    ? 'bg-nexa-500/15 text-nexa-300'
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                )}
                title={d.label}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/5 text-xs text-white/40">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            localhost:5173/
            {projectName.toLowerCase().replace(/\s+/g, '-')}
          </div>

          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all disabled:opacity-40"
            title="Baixar projeto (.zip)"
          >
            <Download className={cn('w-4 h-4', downloading && 'animate-pulse')} />
          </button>

          <button
            onClick={() => {
              const blob = new Blob([previewCode], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              window.open(url, '_blank');
              setTimeout(() => {
                URL.revokeObjectURL(url);
              }, 1000);
            }}
            className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all"
            title="Open source"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 bg-bg-900 overflow-auto flex items-start justify-center p-4">
        <div
          className={cn(
            'bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300',
            device !== 'desktop' && 'border border-white/10'
          )}
          style={{
            width: sizes[device].width,
            height: sizes[device].height,
            maxWidth: '100%',
          }}
        >
          <iframe
            key={iframeKey}
            srcDoc={srcDoc}
            title="Preview"
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
}
