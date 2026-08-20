import { useEffect, useState } from 'react';

interface Props {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function Spinner({ children, delay = 0, className = '' }: Props) {
  const [show, setShow] = useState(delay === 0);
  useEffect(() => {
    if (delay > 0) {
      const t = setTimeout(() => setShow(true), delay);
      return () => clearTimeout(t);
    }
  }, [delay]);

  if (!show) return null;
  return (
    <div className={`flex items-center gap-2 text-white/60 text-sm ${className}`}>
      <div className="w-4 h-4 border-2 border-nexa-500/30 border-t-nexa-500 rounded-full animate-spin" />
      {children}
    </div>
  );
}
