interface StarProps {
  className?: string;
  size?: number;
  fill?: boolean;
  strokeWidth?: number;
  rotate?: number;
}

/**
 * Estrela desenhada "à mão" — elemento decorativo recorrente da identidade
 * scrapbook. `currentColor` controla traço e preenchimento, então é só
 * passar text-lavender-ink / text-sage-ink / text-rose-deep etc.
 */
export function Star({
  className = '',
  size = 20,
  fill = false,
  strokeWidth = 1.6,
  rotate = 0,
}: StarProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      style={rotate ? { transform: `rotate(${rotate}deg)` } : undefined}
      fill={fill ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M12 3.2 L14.5 8.8 L20.6 9.5 L15.9 13.7 L17.5 19.8 L12 16.5 L6.5 19.8 L8.1 13.7 L3.4 9.5 L9.5 8.8 Z" />
    </svg>
  );
}
