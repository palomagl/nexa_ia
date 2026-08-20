import { cn } from '../../lib/utils';

interface Props {
  className?: string;
  lines?: number;
}

export function Skeleton({ className, lines = 1 }: Props) {
  if (lines > 1) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className={cn('skeleton h-4', className)} style={{ width: `${100 - i * 15}%` }} />
        ))}
      </div>
    );
  }
  return <div className={cn('skeleton', className)} />;
}
