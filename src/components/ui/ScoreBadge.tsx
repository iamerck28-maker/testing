'use client';

import { getScoreColor } from '@/lib/constants';

interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_STYLES = {
  sm: 'h-7 w-7 text-[10px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-12 w-12 text-sm',
} as const;

export default function ScoreBadge({ score, size = 'md' }: ScoreBadgeProps) {
  const color = getScoreColor(score);

  return (
    <div
      className={`flex items-center justify-center rounded-lg font-mono font-bold ${SIZE_STYLES[size]}`}
      style={{
        color,
        backgroundColor: `${color}1a`,
        border: `1px solid ${color}33`,
      }}
    >
      {score}
    </div>
  );
}
