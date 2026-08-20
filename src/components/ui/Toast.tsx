import { useStore } from '../../store/useStore';
import { CheckCircle2, XCircle, Info, Loader2, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export function ToastContainer() {
  const { toasts, removeToast } = useStore();

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 w-80">
      {toasts.map(t => (
        <div
          key={t.id}
          className={cn(
            'glass-strong rounded-xl p-4 shadow-2xl animate-slide-up flex items-start gap-3',
            t.type === 'success' && 'border-green-500/30',
            t.type === 'error' && 'border-red-500/30',
            t.type === 'loading' && 'border-nexa-500/30'
          )}
        >
          {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />}
          {t.type === 'error' && <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />}
          {t.type === 'info' && <Info className="w-5 h-5 text-nexa-400 flex-shrink-0 mt-0.5" />}
          {t.type === 'loading' && <Loader2 className="w-5 h-5 text-nexa-400 flex-shrink-0 mt-0.5 animate-spin" />}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">{t.title}</p>
            {t.message && <p className="text-xs text-white/50 mt-0.5">{t.message}</p>}
          </div>
          <button onClick={() => removeToast(t.id)} className="text-white/30 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
