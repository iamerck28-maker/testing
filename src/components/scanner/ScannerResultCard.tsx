'use client';

import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { ScannerPick } from '@/lib/types';
import { formatPrice } from '@/lib/constants';
import ScoreBadge from '@/components/ui/ScoreBadge';
import Chip from '@/components/ui/Chip';

interface ScannerResultCardProps {
  pick: ScannerPick;
  onClick: () => void;
}

export default function ScannerResultCard({
  pick,
  onClick,
}: ScannerResultCardProps) {
  const isPositive = pick.change24h >= 0;
  const visibleSignals = pick.signals.slice(0, 3);
  const overflowCount = pick.signals.length - 3;

  return (
    <button
      onClick={onClick}
      className="flex w-full flex-col gap-2.5 rounded-[14px] border border-border-line bg-surface-card p-3 text-left transition-colors hover:border-text-muted/30 active:bg-surface-card/80"
    >
      {/* Top row: Symbol, Price, Change, Score */}
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-text-primary">
              {pick.symbol}
            </span>
            <span className="truncate text-[11px] text-text-muted">
              {pick.name}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-mono-price text-sm font-semibold text-text-primary">
              {formatPrice(pick.price)}
            </span>
            <span
              className={`flex items-center gap-0.5 text-xs font-semibold ${
                isPositive ? 'text-bullish' : 'text-bearish'
              }`}
            >
              {isPositive ? (
                <ArrowUpRight size={14} />
              ) : (
                <ArrowDownRight size={14} />
              )}
              {Math.abs(pick.change24h).toFixed(2)}%
            </span>
          </div>
        </div>

        <ScoreBadge score={pick.score} size="md" />
      </div>

      {/* Signal chips */}
      <div className="flex flex-wrap items-center gap-1">
        {visibleSignals.map((signal) => (
          <Chip
            key={signal}
            label={signal}
            variant="filled"
            color={
              pick.direction === 'bullish'
                ? 'bullish'
                : pick.direction === 'bearish'
                ? 'bearish'
                : 'neutral'
            }
            size="sm"
          />
        ))}
        {overflowCount > 0 && (
          <Chip
            label={`+${overflowCount} lagi`}
            variant="outline"
            color="default"
            size="sm"
          />
        )}
      </div>

      {/* Meta line */}
      <p className="text-[10.5px] leading-tight text-text-muted">{pick.meta}</p>
    </button>
  );
}
