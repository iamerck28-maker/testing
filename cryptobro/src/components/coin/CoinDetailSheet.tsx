'use client';

import { useEffect, useState, useMemo } from 'react';
import { Star, StarOff, Sparkles, ArrowUpRight, ArrowDownRight, Bell } from 'lucide-react';
import BottomSheet from '@/components/ui/BottomSheet';
import Chip from '@/components/ui/Chip';
import MiniChart from '@/components/coin/MiniChart';
import AlertManager from '@/components/alerts/AlertManager';
import AIAnalysis from '@/components/coin/AIAnalysis';
import { useAppStore, useMarketStore } from '@/lib/store';
import { fetchCoinOHLCV } from '@/lib/api';
import { formatPrice, formatVolume, SCANNERS } from '@/lib/constants';
import { runScanner } from '@/lib/scanner-engine';
import type { OHLCV, IndicatorData } from '@/lib/types';

function generateMockIndicators(price: number, change: number): IndicatorData {
  const seed = (v: number) => {
    const x = Math.sin(v) * 10000;
    return x - Math.floor(x);
  };
  const rsi = 50 + change * 2 + seed(price * 7) * 15 - 7;
  return {
    rsi: Math.max(10, Math.min(90, rsi)),
    macd: {
      value: change * 0.5 + seed(price * 11) * 2 - 1,
      signal: change * 0.3 + seed(price * 13) * 1.5 - 0.75,
      histogram: change * 0.2 + seed(price * 17) * 1 - 0.5,
    },
    ma: {
      ma20: price * (1 + (seed(price * 19) * 0.04 - 0.02)),
      ma50: price * (1 + (seed(price * 23) * 0.08 - 0.04)),
      ma200: price * (1 + (seed(price * 29) * 0.15 - 0.075)),
    },
    stochRsi: {
      k: Math.max(0, Math.min(100, 50 + change * 3 + seed(price * 31) * 30 - 15)),
      d: Math.max(0, Math.min(100, 50 + change * 2 + seed(price * 37) * 25 - 12)),
    },
    bb: {
      upper: price * 1.03,
      middle: price,
      lower: price * 0.97,
    },
    volume: {
      current: 1e6 * (1 + seed(price * 41) * 3),
      average: 1e6 * (1 + seed(price * 43)),
      ratio: 0.5 + seed(price * 47) * 3,
    },
  };
}

function getIndicatorStatus(
  label: string,
  indicators: IndicatorData
): { value: string; status: 'bullish' | 'bearish' | 'neutral' } {
  switch (label) {
    case 'RSI': {
      const v = indicators.rsi;
      return {
        value: v.toFixed(1),
        status: v < 30 ? 'bullish' : v > 70 ? 'bearish' : 'neutral',
      };
    }
    case 'MACD': {
      const h = indicators.macd.histogram;
      return {
        value: h.toFixed(3),
        status: h > 0 ? 'bullish' : h < 0 ? 'bearish' : 'neutral',
      };
    }
    case 'MA': {
      const above = indicators.ma.ma20 > indicators.ma.ma50;
      return {
        value: above ? 'Bullish Cross' : 'Bearish Cross',
        status: above ? 'bullish' : 'bearish',
      };
    }
    case 'StochRSI': {
      const k = indicators.stochRsi.k;
      return {
        value: `${k.toFixed(0)} / ${indicators.stochRsi.d.toFixed(0)}`,
        status: k < 20 ? 'bullish' : k > 80 ? 'bearish' : 'neutral',
      };
    }
    case 'BB': {
      return {
        value: `W: ${((indicators.bb.upper - indicators.bb.lower) / indicators.bb.middle * 100).toFixed(1)}%`,
        status: 'neutral',
      };
    }
    case 'Volume': {
      const r = indicators.volume.ratio;
      return {
        value: `x${r.toFixed(1)}`,
        status: r > 2 ? 'bullish' : r < 0.5 ? 'bearish' : 'neutral',
      };
    }
    default:
      return { value: '-', status: 'neutral' };
  }
}

const STATUS_COLORS = {
  bullish: 'border-bullish/30 bg-bullish/10',
  bearish: 'border-bearish/30 bg-bearish/10',
  neutral: 'border-border-line bg-surface-card',
};

const STATUS_TEXT = {
  bullish: 'text-bullish',
  bearish: 'text-bearish',
  neutral: 'text-text-secondary',
};

export default function CoinDetailSheet() {
  const { selectedCoin, coinDetailOpen, closeCoinDetail, addToWatchlist, removeFromWatchlist, watchlist, mode } =
    useAppStore();
  const { coins } = useMarketStore();

  const [ohlcv, setOhlcv] = useState<OHLCV[]>([]);
  const [loadingChart, setLoadingChart] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const coin = coins.find((c) => c.symbol === selectedCoin);
  const isInWatchlist = selectedCoin ? watchlist.includes(selectedCoin) : false;

  useEffect(() => {
    if (!coinDetailOpen || !coin) return;

    let cancelled = false;
    setLoadingChart(true);

    const coinId = coin.name.toLowerCase().replace(/\s+/g, '-');
    fetchCoinOHLCV(coinId)
      .then((data) => {
        if (!cancelled) setOhlcv(data);
      })
      .catch(() => {
        // Silently fail for chart data
      })
      .finally(() => {
        if (!cancelled) setLoadingChart(false);
      });

    return () => {
      cancelled = true;
    };
  }, [coinDetailOpen, coin]);

  const indicators = useMemo(() => {
    if (!coin) return null;
    return generateMockIndicators(coin.price, coin.change24h);
  }, [coin]);

  const supportResistance = useMemo(() => {
    if (!coin) return { support: [], resistance: [] };
    return {
      support: [
        coin.low24h,
        coin.price * 0.95,
        coin.price * 0.9,
      ],
      resistance: [
        coin.high24h,
        coin.price * 1.05,
        coin.price * 1.1,
      ],
    };
  }, [coin]);

  const scannerMatches = useMemo(() => {
    if (!coin || coins.length === 0) return [];
    const matches: string[] = [];
    for (const scanner of SCANNERS) {
      if (scanner.id === 'confluence') continue;
      const picks = runScanner(scanner.id, coins);
      if (picks.some((p) => p.symbol === coin.symbol)) {
        matches.push(scanner.name);
      }
    }
    return matches;
  }, [coin, coins]);

  const scoreBarValue = coin ? Math.max(-30, Math.min(30, coin.change24h * 3)) : 0;

  if (!coin) return null;

  const isPositive = coin.change24h >= 0;
  const indicatorLabels = ['RSI', 'MACD', 'MA', 'StochRSI', 'BB', 'Volume'];

  return (
    <BottomSheet
      isOpen={coinDetailOpen}
      onClose={closeCoinDetail}
      title={`${coin.symbol} Detail`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={coin.image}
            alt={coin.symbol}
            className="h-10 w-10 rounded-full"
          />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-text-primary">{coin.symbol}</h3>
              <span className="rounded-md bg-accent/15 px-1.5 py-0.5 text-[9px] font-bold text-accent">
                #{coin.rank}
              </span>
            </div>
            <p className="text-[11px] text-text-muted">{coin.name}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono-price text-base font-bold text-text-primary">
            {formatPrice(coin.price)}
          </p>
          <p
            className={`flex items-center justify-end gap-0.5 text-xs font-semibold ${
              isPositive ? 'text-bullish' : 'text-bearish'
            }`}
          >
            {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {isPositive ? '+' : ''}
            {coin.change24h.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Mini Chart */}
      <div className="mt-4 w-full overflow-hidden rounded-xl">
        {loadingChart ? (
          <div className="skeleton h-40 w-full rounded-xl" />
        ) : (
          <MiniChart ohlcv={ohlcv} height={160} isPositive={isPositive} />
        )}
      </div>

      {/* Score Bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-[10px] text-text-muted">
          <span>-30 Bearish</span>
          <span className="font-semibold text-text-secondary">Skor Sentimen</span>
          <span>+30 Bullish</span>
        </div>
        <div className="mt-1.5 relative h-3 w-full overflow-hidden rounded-full bg-surface-card">
          {/* Center line */}
          <div className="absolute left-1/2 top-0 h-full w-px bg-text-muted/30" />
          {/* Bar */}
          <div
            className="absolute top-0 h-full rounded-full transition-all"
            style={{
              left: scoreBarValue >= 0 ? '50%' : `${50 + (scoreBarValue / 30) * 50}%`,
              width: `${Math.abs(scoreBarValue / 30) * 50}%`,
              backgroundColor: scoreBarValue >= 0 ? '#0ecb81' : '#f6465d',
            }}
          />
        </div>
      </div>

      {/* Indicator Grid */}
      {indicators && (
        <div className="mt-4">
          <p className="mb-2 text-[11px] font-semibold text-text-secondary">
            Indikator Teknikal
          </p>
          <div className="grid grid-cols-3 gap-2">
            {indicatorLabels.map((label) => {
              const info = getIndicatorStatus(label, indicators);
              return (
                <div
                  key={label}
                  className={`rounded-xl border p-2.5 ${STATUS_COLORS[info.status]}`}
                >
                  <p className="text-[10px] font-medium text-text-muted">{label}</p>
                  <p className={`mt-1 font-mono-price text-xs font-bold ${STATUS_TEXT[info.status]}`}>
                    {info.value}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Support / Resistance */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="mb-2 text-[11px] font-semibold text-bullish">Support</p>
          <div className="flex flex-col gap-1">
            {supportResistance.support.map((level, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg bg-bullish/5 px-2.5 py-1.5"
              >
                <span className="text-[10px] text-text-muted">S{i + 1}</span>
                <span className="font-mono-price text-[11px] font-semibold text-bullish">
                  {formatPrice(level)}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-[11px] font-semibold text-bearish">Resistance</p>
          <div className="flex flex-col gap-1">
            {supportResistance.resistance.map((level, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg bg-bearish/5 px-2.5 py-1.5"
              >
                <span className="text-[10px] text-text-muted">R{i + 1}</span>
                <span className="font-mono-price text-[11px] font-semibold text-bearish">
                  {formatPrice(level)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scanner Check */}
      {scannerMatches.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-[11px] font-semibold text-text-secondary">
            Terdeteksi oleh Scanner
          </p>
          <div className="flex flex-wrap gap-1.5">
            {scannerMatches.map((name) => (
              <Chip key={name} label={name} variant="filled" color="accent" size="md" />
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-6 flex gap-3">
        <button
          onClick={() => setAiOpen(true)}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-bold text-bg-primary transition-transform active:scale-[0.98]"
        >
          <Sparkles size={16} />
          Analisa AI
        </button>
        <button
          onClick={() => setAlertOpen(true)}
          className="flex items-center justify-center rounded-xl border border-border-line bg-surface-card px-3 py-3 text-text-secondary transition-transform active:scale-[0.98]"
        >
          <Bell size={16} />
        </button>
        <button
          onClick={() => {
            if (!selectedCoin) return;
            if (isInWatchlist) {
              removeFromWatchlist(selectedCoin);
            } else {
              addToWatchlist(selectedCoin);
            }
          }}
          className={`flex items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-bold transition-transform active:scale-[0.98] ${
            isInWatchlist
              ? 'border-accent bg-accent/10 text-accent'
              : 'border-border-line bg-surface-card text-text-secondary'
          }`}
        >
          {isInWatchlist ? <StarOff size={16} /> : <Star size={16} />}
          {isInWatchlist ? 'Hapus' : 'Watchlist'}
        </button>
      </div>

      {/* Alert Manager */}
      <AlertManager
        symbol={coin.symbol}
        currentPrice={coin.price}
        isOpen={alertOpen}
        onClose={() => setAlertOpen(false)}
      />

      {/* AI Analysis */}
      {indicators && (
        <AIAnalysis
          symbol={coin.symbol}
          price={coin.price}
          change24h={coin.change24h}
          indicators={indicators}
          support={supportResistance.support}
          resistance={supportResistance.resistance}
          mode={mode}
          isOpen={aiOpen}
          onClose={() => {
            setAiOpen(false);
          }}
        />
      )}
    </BottomSheet>
  );
}
