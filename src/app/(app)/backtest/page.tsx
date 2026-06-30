'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Play, TrendingUp, TrendingDown, BarChart2, AlertTriangle } from 'lucide-react';
import { useMarketStore } from '@/lib/store';
import { fetchMarketData, fetchCoinOHLCV } from '@/lib/api';
import { runBacktest, type BacktestStrategy } from '@/lib/backtest-engine';
import { formatPrice } from '@/lib/constants';
import type { BacktestResult } from '@/lib/types';

const STRATEGIES: { id: BacktestStrategy; label: string; desc: string }[] = [
  {
    id: 'ma_crossover',
    label: 'MA Crossover (20/50)',
    desc: 'Beli saat MA20 melewati MA50, jual saat sebaliknya',
  },
  {
    id: 'rsi_strategy',
    label: 'RSI Strategy (30/70)',
    desc: 'Beli saat RSI < 30 (oversold), jual saat RSI > 70 (overbought)',
  },
];

const PERIODS: { days: number; label: string }[] = [
  { days: 30, label: '1 Bulan' },
  { days: 90, label: '3 Bulan' },
];

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  });
}

export default function BacktestPage() {
  const router = useRouter();
  const { coins, setCoins } = useMarketStore();

  const [search, setSearch] = useState('');
  const [selectedCoin, setSelectedCoin] = useState<{ id: string; symbol: string } | null>(null);
  const [strategy, setStrategy] = useState<BacktestStrategy>('ma_crossover');
  const [days, setDays] = useState(90);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTrades, setShowTrades] = useState(false);

  const filteredCoins = coins
    .filter(
      (c) =>
        c.symbol.toLowerCase().includes(search.toLowerCase()) ||
        c.name.toLowerCase().includes(search.toLowerCase()),
    )
    .slice(0, 8);

  const handleRun = useCallback(async () => {
    if (!selectedCoin) return;
    setRunning(true);
    setResult(null);
    setError(null);

    try {
      let coinList = coins;
      if (coinList.length === 0) {
        coinList = await fetchMarketData();
        setCoins(coinList);
      }
      const ohlcv = await fetchCoinOHLCV(selectedCoin.id, days);
      if (ohlcv.length < 20) {
        setError('Data historis tidak cukup untuk backtesting');
        return;
      }
      const res = runBacktest(ohlcv, selectedCoin.symbol, strategy);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menjalankan backtest');
    } finally {
      setRunning(false);
    }
  }, [selectedCoin, strategy, days, coins, setCoins]);

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-border-line bg-bg-primary/90 px-4 py-3 backdrop-blur-lg">
        <button
          onClick={() => router.back()}
          className="rounded-lg p-1.5 text-text-muted transition-colors hover:text-text-primary"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex flex-1 items-center gap-2">
          <BarChart2 size={18} className="text-accent" />
          <h1 className="text-sm font-bold text-text-primary">Backtesting</h1>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-4 px-4 py-4">
        {/* Coin Search */}
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold text-text-secondary">
            Pilih Coin
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedCoin(null);
              setResult(null);
            }}
            placeholder="Cari coin (BTC, ETH, ...)"
            className="w-full rounded-xl border border-border-line bg-surface-card px-4 py-3 text-sm text-text-primary outline-none focus:border-accent"
          />
          {search.length > 0 && !selectedCoin && filteredCoins.length > 0 && (
            <div className="mt-1 overflow-hidden rounded-xl border border-border-line bg-surface-card">
              {filteredCoins.map((c) => (
                <button
                  key={c.id}
                  onClick={async () => {
                    setSelectedCoin({ id: c.id, symbol: c.symbol });
                    setSearch(`${c.symbol} — ${c.name}`);
                    if (coins.length === 0) {
                      const data = await fetchMarketData();
                      setCoins(data);
                    }
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-bg-secondary"
                >
                  <img src={c.image} alt={c.symbol} className="h-6 w-6 rounded-full" />
                  <span className="text-xs font-bold text-text-primary">{c.symbol}</span>
                  <span className="text-xs text-text-muted">{c.name}</span>
                </button>
              ))}
            </div>
          )}
          {selectedCoin && (
            <p className="mt-1.5 text-[11px] text-accent">✓ {selectedCoin.symbol} dipilih</p>
          )}
        </div>

        {/* Strategy */}
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold text-text-secondary">
            Strategi
          </label>
          <div className="flex flex-col gap-2">
            {STRATEGIES.map((s) => (
              <button
                key={s.id}
                onClick={() => { setStrategy(s.id); setResult(null); }}
                className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                  strategy === s.id
                    ? 'border-accent bg-accent/10'
                    : 'border-border-line bg-surface-card hover:bg-bg-secondary'
                }`}
              >
                <p className={`text-xs font-bold ${strategy === s.id ? 'text-accent' : 'text-text-primary'}`}>
                  {s.label}
                </p>
                <p className="mt-0.5 text-[10px] text-text-muted">{s.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Period */}
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold text-text-secondary">
            Periode
          </label>
          <div className="flex gap-2">
            {PERIODS.map((p) => (
              <button
                key={p.days}
                onClick={() => { setDays(p.days); setResult(null); }}
                className={`flex-1 rounded-xl border py-2.5 text-xs font-bold transition-colors ${
                  days === p.days
                    ? 'border-accent bg-accent text-bg-primary'
                    : 'border-border-line bg-surface-card text-text-muted hover:text-text-secondary'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Run Button */}
        <button
          onClick={handleRun}
          disabled={!selectedCoin || running}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold transition-all active:scale-[0.98] ${
            selectedCoin && !running
              ? 'bg-accent text-bg-primary'
              : 'bg-surface-card text-text-muted cursor-not-allowed'
          }`}
        >
          {running ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-bg-primary/30 border-t-bg-primary" />
              Menjalankan backtest...
            </>
          ) : (
            <>
              <Play size={16} />
              Jalankan Backtest
            </>
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-bearish/30 bg-bearish/5 px-4 py-3">
            <AlertTriangle size={14} className="text-bearish flex-shrink-0" />
            <p className="text-xs text-bearish">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-3">
            {/* Summary header */}
            <div className="rounded-xl border border-border-line bg-surface-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-text-muted">{result.strategy}</p>
                  <p className="mt-0.5 text-xs text-text-secondary">
                    {formatDate(result.startDate)} – {formatDate(result.endDate)}
                  </p>
                </div>
                <div
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-bold ${
                    result.totalReturn >= 0
                      ? 'bg-bullish/15 text-bullish'
                      : 'bg-bearish/15 text-bearish'
                  }`}
                >
                  {result.totalReturn >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {result.totalReturn >= 0 ? '+' : ''}{result.totalReturn.toFixed(2)}%
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  label: 'Win Rate',
                  value: `${result.winRate.toFixed(1)}%`,
                  color: result.winRate >= 50 ? 'text-bullish' : 'text-bearish',
                },
                {
                  label: 'Jumlah Trade',
                  value: `${result.tradeCount}`,
                  color: 'text-text-primary',
                },
                {
                  label: 'Max Drawdown',
                  value: `-${result.maxDrawdown.toFixed(1)}%`,
                  color: 'text-bearish',
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-border-line bg-surface-card p-3 text-center"
                >
                  <p className={`font-mono-price text-base font-bold ${s.color}`}>{s.value}</p>
                  <p className="mt-0.5 text-[10px] text-text-muted">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Trades list */}
            {result.trades.length > 0 && (
              <div>
                <button
                  onClick={() => setShowTrades(!showTrades)}
                  className="mb-2 w-full text-left text-[11px] font-semibold text-text-secondary"
                >
                  {showTrades ? '▾' : '▸'} {result.trades.length} Trade{result.trades.length !== 1 ? 's' : ''}
                </button>
                {showTrades && (
                  <div className="flex flex-col gap-1.5">
                    {result.trades.map((trade, i) => (
                      <div
                        key={i}
                        className={`flex items-center justify-between rounded-xl border px-3 py-2.5 ${
                          trade.returnPct >= 0
                            ? 'border-bullish/20 bg-bullish/5'
                            : 'border-bearish/20 bg-bearish/5'
                        }`}
                      >
                        <div>
                          <p className="text-[11px] font-semibold text-text-secondary">
                            {formatDate(trade.entryDate)} → {formatDate(trade.exitDate)}
                          </p>
                          <p className="text-[10px] text-text-muted">
                            {formatPrice(trade.entryPrice)} → {formatPrice(trade.exitPrice)}
                          </p>
                        </div>
                        <span
                          className={`font-mono-price text-sm font-bold ${
                            trade.returnPct >= 0 ? 'text-bullish' : 'text-bearish'
                          }`}
                        >
                          {trade.returnPct >= 0 ? '+' : ''}{trade.returnPct.toFixed(2)}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {result.tradeCount === 0 && (
              <div className="rounded-xl border border-border-line bg-surface-card py-8 text-center">
                <p className="text-sm text-text-muted">
                  Tidak ada trade yang terjadi dalam periode ini.
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  Coba periode lebih panjang atau strategi berbeda.
                </p>
              </div>
            )}

            <p className="text-center text-[9px] text-text-muted/50">
              Hasil backtesting bukan jaminan performa masa depan. Past performance ≠ future results.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
