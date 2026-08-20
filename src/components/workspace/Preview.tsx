import { useState } from 'react';
import {
  Monitor, Tablet, Smartphone, RefreshCw, ExternalLink, RotateCcw,
} from 'lucide-react';
import type { PreviewDevice } from '../../types';
import { cn } from '../../lib/utils';

interface Props {
  html: string;
  projectName: string;
}

export function Preview({ html, projectName }: Props) {
  const [device, setDevice] = useState<PreviewDevice>('desktop');
  const [refreshKey, setRefreshKey] = useState(0);

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

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
        <div className="flex items-center gap-1">
          {devices.map(d => (
            <button
              key={d.id}
              onClick={() => setDevice(d.id)}
              className={cn(
                'p-2 rounded-lg transition-all',
                device === d.id ? 'bg-nexa-500/15 text-nexa-300' : 'text-white/40 hover:text-white hover:bg-white/5'
              )}
              title={d.label}
            >
              <d.icon className="w-4 h-4" />
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/5 text-xs text-white/40">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            localhost:5173/{projectName.toLowerCase().replace(/\s+/g, '-')}
          </div>
          <button onClick={() => setRefreshKey(k => k + 1)} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all" title="Open in new tab">
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 bg-bg-900 overflow-auto flex items-start justify-center p-4">
        <div
          className={cn(
            'bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300',
            device !== 'desktop' && 'border border-white/10'
          )}
          style={{
            width: sizes[device].width,
            height: device === 'desktop' ? sizes[device].height : sizes[device].height,
            maxWidth: '100%',
          }}
        >
          <iframe
            key={refreshKey}
            srcDoc={`<!doctype html><html><head><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Inter,sans-serif}</style></head><body>${html}</body></html>`}
            title="Preview"
            className="w-full h-full border-0"
            sandbox="allow-scripts"
          />
        </div>
      </div>
    </div>
  );
}
