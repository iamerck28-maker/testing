'use client';

import { useMemo } from 'react';
import { useMarketStore } from '@/lib/store';
import { useAppStore } from '@/lib/store';
import type { CoinData } from '@/lib/types';

function getHeatmapColor(change: number): string {
  if (change < -5) return '#7f1d1d';
  if (change < -3) return '#991b1b';
  if (change < -1) return '#b91c1c';
  if (change < 0) return '#dc2626';
  if (change === 0) return '#374151';
  if (change < 1) return '#15803d';
  if (change < 3) return '#16a34a';
  if (change < 5) return '#22c55e';
  return '#4ade80';
}

interface TreemapCell {
  coin: CoinData;
  flex: number;
}

interface TreemapRow {
  cells: TreemapCell[];
  rowFlex: number;
}

function buildTreemapRows(coins: CoinData[]): TreemapRow[] {
  if (coins.length === 0) return [];

  const totalMcap = coins.reduce((sum, c) => sum + c.marketCap, 0);
  if (totalMcap === 0) return [];

  const rows: TreemapRow[] = [];
  let i = 0;

  // Simple row-based layout: each row holds ~4-6 coins whose combined mcap ~ 1/target_rows
  const TARGET_ROWS = 5;
  const rowTargetFraction = 1 / TARGET_ROWS;

  while (i < coins.length) {
    let rowMcap = 0;
    const rowCoins: CoinData[] = [];

    while (i < coins.length) {
      const coinFraction = coins[i].marketCap / totalMcap;
      rowCoins.push(coins[i]);
      rowMcap += coins[i].marketCap;
      i++;

      // Stop this row when: we've hit enough mcap for a row,
      // or we've accumulated at least 4 coins and reached the target,
      // or we have 7 coins in the row already
      if (rowMcap / totalMcap >= rowTargetFraction && rowCoins.length >= 2) break;
      if (rowCoins.length >= 7) break;
    }

    const rowFlex = rowMcap / totalMcap;
    const cells: TreemapCell[] = rowCoins.map((coin) => ({
      coin,
      flex: coin.marketCap / rowMcap,
    }));

    rows.push({ cells, rowFlex });
  }

  return rows;
}

function HeatmapSkeleton() {
  return (
    <div className="flex h-[320px] w-full flex-col gap-1 md:h-[400px]">
      {Array.from({ length: 5 }).map((_, ri) => (
        <div key={ri} className="flex flex-1 gap-1">
          {Array.from({ length: ri === 0 ? 2 : 4 }).map((_, ci) => (
            <div key={ci} className="skeleton flex-1 rounded-md" />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function Heatmap() {
  const { coins, loading } = useMarketStore();
  const { openCoinDetail } = useAppStore();

  const top30 = useMemo(
    () =>
      [...coins]
        .sort((a, b) => b.marketCap - a.marketCap)
        .slice(0, 30),
    [coins]
  );

  const rows = useMemo(() => buildTreemapRows(top30), [top30]);

  if (loading && coins.length === 0) {
    return <HeatmapSkeleton />;
  }

  if (coins.length === 0) {
    return (
      <div className="flex h-[320px] items-center justify-center text-sm text-text-muted">
        Tidak ada data
      </div>
    );
  }

  return (
    <div
      className="w-full overflow-hidden rounded-xl"
      style={{ height: 'clamp(320px, 50vw, 400px)' }}
    >
      <div className="flex h-full flex-col gap-[2px]">
        {rows.map((row, ri) => (
          <div
            key={ri}
            className="flex gap-[2px]"
            style={{ flex: row.rowFlex }}
          >
            {row.cells.map(({ coin, flex }) => {
              const bg = getHeatmapColor(coin.change24h);
              const isPositive = coin.change24h >= 0;
              const changeStr = `${isPositive ? '+' : ''}${coin.change24h.toFixed(2)}%`;

              return (
                <button
                  key={coin.symbol}
                  onClick={() => openCoinDetail(coin.symbol)}
                  className="relative flex min-h-[40px] min-w-[40px] flex-col items-center justify-center overflow-hidden rounded-md transition-opacity hover:opacity-90 active:opacity-75"
                  style={{ flex, backgroundColor: bg }}
                  title={`${coin.name}: ${changeStr}`}
                >
                  <span
                    className="font-bold leading-tight text-white"
                    style={{ fontSize: 'clamp(9px, 1.5vw, 13px)' }}
                  >
                    {coin.symbol}
                  </span>
                  <span
                    className="leading-tight text-white/90"
                    style={{ fontSize: 'clamp(8px, 1.2vw, 11px)' }}
                  >
                    {changeStr}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
