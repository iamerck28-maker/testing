'use client';

import { useEffect, useState } from 'react';
import { useAppStore, useMarketStore } from '@/lib/store';
import { SCANNERS, MODE_CONFIG, formatPrice, formatVolume } from '@/lib/constants';
import { fetchMarketData, fetchMarketPulse } from '@/lib/api';
import { runScanner } from '@/lib/scanner-engine';
import ScannerCard from '@/components/scanner/ScannerCard';
import Skeleton from '@/components/ui/Skeleton';
import type { ScannerPick } from '@/lib/types';

export default function HomePage() {
  const { mode, setMode, marketType, setMarketType, recentlyViewed, openCoinDetail } =
    useAppStore();
  const { coins, loading, setCoins, setLoading, setError, marketPulse, setMarketPulse } =
    useMarketStore();

  const [signalCounts, setSignalCounts] = useState<Record<string, number>>({});
  const [dominantDirs, setDominantDirs] = useState<
    Record<string, 'bullish' | 'bearish' | 'neutral'>
  >({});
  const [scannerLoading, setScannerLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setScannerLoading(true);
      try {
        const [data, pulse] = await Promise.all([
          fetchMarketData(),
          fetchMarketPulse(),
        ]);
        if (cancelled) return;
        setCoins(data);
        setMarketPulse(pulse);

        // Run scanners to get counts
        const counts: Record<string, number> = {};
        const dirs: Record<string, 'bullish' | 'bearish' | 'neutral'> = {};
        const allResults: Record<string, ScannerPick[]> = {};

        for (const scanner of SCANNERS) {
          if (scanner.id === 'confluence') continue;
          const picks = runScanner(scanner.id, data);
          allResults[scanner.id] = picks;
          counts[scanner.id] = picks.length;
          if (picks.length > 0) {
            const bullCount = picks.filter((p) => p.direction === 'bullish').length;
            const bearCount = picks.filter((p) => p.direction === 'bearish').length;
            dirs[scanner.id] =
              bullCount > bearCount
                ? 'bullish'
                : bearCount > bullCount
                  ? 'bearish'
                  : 'neutral';
          }
        }

        // Run confluence last with all results
        const confluencePicks = runScanner('confluence', data, allResults);
        counts['confluence'] = confluencePicks.length;
        if (confluencePicks.length > 0) {
          dirs['confluence'] = 'bullish';
        }

        if (!cancelled) {
          setSignalCounts(counts);
          setDominantDirs(dirs);
          setScannerLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Gagal memuat data');
          setScannerLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [mode, marketType, setCoins, setLoading, setError, setMarketPulse]);

  const recentCoins = coins.filter((c) => recentlyViewed.includes(c.symbol));

  return (
    <div className="px-4 py-3">
      {/* Scanner Grid */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-text-secondary">
          Scanner Hub
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {scannerLoading
            ? Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} variant="card" className="h-[110px]" />
              ))
            : SCANNERS.map((scanner) => (
                <ScannerCard
                  key={scanner.id}
                  scanner={scanner}
                  signalCount={signalCounts[scanner.id] ?? null}
                  dominantDirection={dominantDirs[scanner.id] ?? null}
                />
              ))}
        </div>
      </section>

      {/* Market Pulse */}
      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-text-secondary">
          Market Pulse
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {loading || !marketPulse ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton
                key={i}
                variant="card"
                className="h-[80px] min-w-[150px] flex-shrink-0"
              />
            ))
          ) : (
            <>
              <PulseCard
                label="Fear & Greed"
                value={String(marketPulse.fearGreed.value)}
                sub={marketPulse.fearGreed.label}
                color={
                  marketPulse.fearGreed.value > 60
                    ? 'text-bullish'
                    : marketPulse.fearGreed.value < 40
                      ? 'text-bearish'
                      : 'text-neutral'
                }
              />
              <PulseCard
                label="BTC Dominance"
                value={`${marketPulse.btcDominance.toFixed(1)}%`}
                sub="Dominasi Bitcoin"
                color="text-accent"
              />
              <PulseCard
                label="Funding Rate"
                value={`${(marketPulse.fundingRate * 100).toFixed(3)}%`}
                sub={marketPulse.fundingRate >= 0 ? 'Bullish bias' : 'Bearish bias'}
                color={marketPulse.fundingRate >= 0 ? 'text-bullish' : 'text-bearish'}
              />
              <PulseCard
                label="Total Volume"
                value={formatVolume(marketPulse.totalVolume)}
                sub="24h Volume"
                color="text-info"
              />
            </>
          )}
        </div>
      </section>

      {/* Recently Viewed */}
      {recentCoins.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-sm font-semibold text-text-secondary">
            Terakhir Dilihat
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {recentCoins.map((coin) => (
              <button
                key={coin.symbol}
                onClick={() => openCoinDetail(coin.symbol)}
                className="flex min-w-[140px] flex-shrink-0 items-center gap-3 rounded-xl border border-border-line bg-surface-card p-3 transition-colors active:bg-bg-secondary"
              >
                <img
                  src={coin.image}
                  alt={coin.symbol}
                  className="h-8 w-8 rounded-full"
                />
                <div className="text-left">
                  <p className="text-xs font-bold text-text-primary">
                    {coin.symbol}
                  </p>
                  <p className="font-mono-price text-[11px] text-text-secondary">
                    {formatPrice(coin.price)}
                  </p>
                  <p
                    className={`text-[10px] font-semibold ${
                      coin.change24h >= 0 ? 'text-bullish' : 'text-bearish'
                    }`}
                  >
                    {coin.change24h >= 0 ? '+' : ''}
                    {coin.change24h.toFixed(2)}%
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function PulseCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="flex min-w-[150px] flex-shrink-0 flex-col justify-between rounded-xl border border-border-line bg-surface-card p-3">
      <p className="text-[10px] font-medium uppercase tracking-wide text-text-muted">
        {label}
      </p>
      <p className={`mt-1 font-mono-price text-lg font-bold ${color}`}>{value}</p>
      <p className="mt-0.5 text-[10px] text-text-muted">{sub}</p>
    </div>
  );
}
