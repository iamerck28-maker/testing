'use client';

import { useAppStore } from '@/lib/store';
import type { TradingMode, MarketType } from '@/lib/types';
import { MODE_CONFIG } from '@/lib/constants';

interface HeaderProps {
  title?: string;
  showMarketType?: boolean;
  showMode?: boolean;
}

export default function Header({
  title,
  showMarketType = true,
  showMode = false,
}: HeaderProps) {
  const { mode, setMode, marketType, setMarketType } = useAppStore();

  const marketTypes: MarketType[] = ['spot', 'futures'];
  const tradingModes: TradingMode[] = ['scalping', 'intraday', 'swing'];

  return (
    <div className="sticky top-0 z-40 bg-bg-primary/90 backdrop-blur-lg px-4 pt-3 pb-2 md:hidden">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-accent">
          {title || 'CryptoBro'}
        </h1>

        {showMarketType && (
          <div className="flex items-center gap-1 rounded-lg bg-surface-card p-0.5">
            {marketTypes.map((type) => (
              <button
                key={type}
                onClick={() => setMarketType(type)}
                className={`rounded-md px-3 py-1 text-xs font-semibold capitalize transition-colors ${
                  marketType === type
                    ? 'bg-accent text-bg-primary'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        )}
      </div>

      {showMode && (
        <div className="mt-2 flex items-center gap-2">
          {tradingModes.map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                mode === m
                  ? 'bg-accent text-bg-primary'
                  : 'bg-surface-card text-text-muted hover:text-text-secondary'
              }`}
            >
              {MODE_CONFIG[m].label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
