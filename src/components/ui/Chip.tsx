interface ChipProps {
  label: string;
  variant?: 'filled' | 'outline';
  color?: 'bullish' | 'bearish' | 'neutral' | 'info' | 'accent' | 'default';
  size?: 'sm' | 'md';
}

const COLOR_MAP = {
  bullish: {
    filled: 'bg-bullish/15 text-bullish',
    outline: 'border border-bullish/30 text-bullish',
  },
  bearish: {
    filled: 'bg-bearish/15 text-bearish',
    outline: 'border border-bearish/30 text-bearish',
  },
  neutral: {
    filled: 'bg-neutral/15 text-neutral',
    outline: 'border border-neutral/30 text-neutral',
  },
  info: {
    filled: 'bg-info/15 text-info',
    outline: 'border border-info/30 text-info',
  },
  accent: {
    filled: 'bg-accent/15 text-accent',
    outline: 'border border-accent/30 text-accent',
  },
  default: {
    filled: 'bg-surface-card text-text-secondary',
    outline: 'border border-border-line text-text-secondary',
  },
} as const;

const SIZE_STYLES = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-1 text-[11px]',
} as const;

export default function Chip({
  label,
  variant = 'filled',
  color = 'default',
  size = 'sm',
}: ChipProps) {
  return (
    <span
      className={`inline-flex items-center rounded-lg font-semibold leading-none ${COLOR_MAP[color][variant]} ${SIZE_STYLES[size]}`}
    >
      {label}
    </span>
  );
}
