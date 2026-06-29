'use client';

import { useRouter } from 'next/navigation';
import {
  Crosshair,
  CandlestickChart,
  Activity,
  BarChart3,
  Waves,
  Sparkles,
  TrendingUp,
  Layers,
  GitBranch,
  Merge,
} from 'lucide-react';
import type { ScannerConfig } from '@/lib/types';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Crosshair,
  CandlestickChart,
  Activity,
  BarChart3,
  Waves,
  Sparkles,
  TrendingUp,
  Layers,
  GitBranch,
  Merge,
};

interface ScannerCardProps {
  scanner: ScannerConfig;
  signalCount: number | null;
  dominantDirection: 'bullish' | 'bearish' | 'neutral' | null;
}

const DIRECTION_COLORS = {
  bullish: 'bg-bullish',
  bearish: 'bg-bearish',
  neutral: 'bg-neutral',
} as const;

export default function ScannerCard({
  scanner,
  signalCount,
  dominantDirection,
}: ScannerCardProps) {
  const router = useRouter();
  const Icon = ICON_MAP[scanner.icon] || Crosshair;

  return (
    <button
      onClick={() => router.push(`/scanner/${scanner.id}`)}
      className="flex w-full flex-col gap-2 rounded-[14px] border border-border-line bg-surface-card p-3 text-left transition-colors hover:border-text-muted/30 active:bg-surface-card/80"
    >
      <div className="flex items-start justify-between">
        <Icon size={20} className="text-accent" />
        <div className="flex items-center gap-1.5">
          {signalCount !== null && (
            <span className="rounded-md bg-accent/15 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
              {signalCount}
            </span>
          )}
          {dominantDirection && (
            <span
              className={`h-2 w-2 rounded-full ${DIRECTION_COLORS[dominantDirection]}`}
            />
          )}
        </div>
      </div>

      <div>
        <p className="text-[13px] font-bold text-text-primary">
          {scanner.name}
        </p>
        <p className="mt-0.5 text-[10.5px] leading-tight text-text-muted">
          {scanner.description}
        </p>
      </div>
    </button>
  );
}
