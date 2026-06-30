'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Clock } from 'lucide-react';
import { fetchFundingRates } from '@/lib/funding';
import type { FundingRateEntry } from '@/lib/types';

function formatCountdown(ms: number): string {
  if (ms <= 0) return 'Selesai';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}j ${m}m` : `${m}m`;
}

export default function FundingRates() {
  const [rates, setRates] = useState<FundingRateEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFundingRates();
      setRates(data.slice(0, 40));
    } catch {
      setError('Gagal memuat funding rate');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mt-4">
      {/* Info Banner */}
      <div className="mb-3 rounded-xl border border-border-line bg-surface-card p-3">
        <p className="text-[11px] leading-relaxed text-text-secondary">
          <span className="font-semibold text-bullish">Funding negatif</span> = bears membayar longs (sinyal bullish).{' '}
          <span className="font-semibold text-bearish">Funding positif tinggi</span> = longs membayar bears (waspadai long squeeze).
        </p>
      </div>

      {/* Header Row */}
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-semibold text-text-secondary">
          Perpetual Futures (USDT) — Top 40 by Rate
        </p>
        <button
          onClick={load}
          disabled={loading}
          className="rounded-lg p-1.5 text-text-muted transition-colors hover:text-text-primary"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="skeleton h-12 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-sm text-text-muted">{error}</p>
          <button
            onClick={load}
            className="rounded-xl bg-accent px-5 py-2 text-xs font-bold text-bg-primary"
          >
            Coba Lagi
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {rates.map((r) => {
            const isPositive = r.fundingRate >= 0;
            const absRate = Math.abs(r.fundingRate);
            const intensity = Math.min(absRate / 0.1, 1); // normalize to 0-1 at 0.1%
            const countdown = r.nextFundingTime - now;

            return (
              <div
                key={r.symbol}
                className="flex items-center gap-3 rounded-xl border border-border-line bg-surface-card px-3 py-2.5"
              >
                {/* Direction icon */}
                <div
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                    isPositive ? 'bg-bearish/10' : 'bg-bullish/10'
                  }`}
                  style={{ opacity: 0.5 + intensity * 0.5 }}
                >
                  {isPositive ? (
                    <TrendingDown size={14} className="text-bearish" />
                  ) : (
                    <TrendingUp size={14} className="text-bullish" />
                  )}
                </div>

                {/* Symbol */}
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-text-primary">{r.symbol}</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
                    <Clock size={9} />
                    <span>{formatCountdown(countdown)}</span>
                  </div>
                </div>

                {/* Funding Rate */}
                <div className="text-right">
                  <p
                    className={`font-mono-price text-sm font-bold ${
                      isPositive ? 'text-bearish' : 'text-bullish'
                    }`}
                  >
                    {isPositive ? '+' : ''}{r.fundingRate.toFixed(4)}%
                  </p>
                  <p className="text-[10px] text-text-muted">
                    {isPositive ? 'Long membayar' : 'Short membayar'}
                  </p>
                </div>

                {/* Rate bar */}
                <div className="h-8 w-1 overflow-hidden rounded-full bg-surface-card border border-border-line">
                  <div
                    className={`w-full rounded-full transition-all ${isPositive ? 'bg-bearish' : 'bg-bullish'}`}
                    style={{ height: `${intensity * 100}%`, marginTop: isPositive ? '0' : 'auto' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
