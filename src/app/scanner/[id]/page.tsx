'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw } from 'lucide-react';
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
import { useAppStore, useMarketStore } from '@/lib/store';
import { SCANNERS } from '@/lib/constants';
import { fetchMarketData } from '@/lib/api';
import { runScanner } from '@/lib/scanner-engine';
import ScannerResultCard from '@/components/scanner/ScannerResultCard';
import type { ScannerPick } from '@/lib/types';

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

export default function ScannerResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { openCoinDetail } = useAppStore();
  const { coins, setCoins, setLoading: setMarketLoading, setError: setMarketError } =
    useMarketStore();

  const [picks, setPicks] = useState<ScannerPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const scanner = SCANNERS.find((s) => s.id === id);
  const Icon = scanner ? ICON_MAP[scanner.icon] || Activity : Activity;

  const CONFLUENCE_DEPS = ['radar', 'candle', 'chart', 'volume', 'whale', 'accumulation', 'prepump', 'multitf', 'divergence'];

  function buildResults(scannerId: string, coinData: import('@/lib/types').CoinData[]): ScannerPick[] {
    if (scannerId !== 'confluence') return runScanner(scannerId, coinData);
    const allResults: Record<string, ScannerPick[]> = {};
    for (const sid of CONFLUENCE_DEPS) {
      allResults[sid] = runScanner(sid, coinData);
    }
    return runScanner('confluence', coinData, allResults);
  }

  const loadResults = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let coinData = coins;
      if (coinData.length === 0) {
        setMarketLoading(true);
        coinData = await fetchMarketData();
        setCoins(coinData);
      }
      setPicks(buildResults(id, coinData));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data scanner');
    } finally {
      setLoading(false);
    }
  }, [id, coins, setCoins, setMarketLoading]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      setMarketLoading(true);
      const freshCoins = await fetchMarketData();
      setCoins(freshCoins);
      setPicks(buildResults(id, freshCoins));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal refresh');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-border-line bg-bg-primary/90 px-4 py-3 backdrop-blur-lg">
        <button
          onClick={() => router.back()}
          className="rounded-lg p-1.5 text-text-muted transition-colors hover:text-text-primary active:bg-surface-card"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex flex-1 items-center justify-center gap-2">
          <Icon size={18} className="text-accent" />
          <h1 className="text-sm font-bold text-text-primary">
            {scanner?.name || 'Scanner'}
          </h1>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="rounded-lg p-1.5 text-text-muted transition-colors hover:text-text-primary active:bg-surface-card"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-2xl px-4 py-4">
        {scanner && (
          <p className="mb-4 text-xs text-text-muted">{scanner.description}</p>
        )}

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-28 rounded-[14px]" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-bearish/10">
              <span className="text-2xl">!</span>
            </div>
            <p className="text-sm text-text-secondary">{error}</p>
            <button
              onClick={loadResults}
              className="rounded-xl bg-accent px-6 py-2.5 text-xs font-bold text-bg-primary transition-transform active:scale-95"
            >
              Coba Lagi
            </button>
          </div>
        ) : picks.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-card">
              <Activity size={28} className="text-text-muted" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-secondary">
                Tidak ada sinyal saat ini
              </p>
              <p className="mt-1 text-xs text-text-muted">
                Scanner belum mendeteksi sinyal yang memenuhi kriteria
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="rounded-xl bg-accent px-6 py-2.5 text-xs font-bold text-bg-primary transition-transform active:scale-95"
            >
              Refresh
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-text-muted">
              {picks.length} sinyal ditemukan
            </p>
            {picks.map((pick) => (
              <ScannerResultCard
                key={pick.symbol}
                pick={pick}
                onClick={() => openCoinDetail(pick.symbol)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
