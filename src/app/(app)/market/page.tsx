'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { ArrowUpRight, ArrowDownRight, ChevronUp, ChevronDown, RefreshCw, Star } from 'lucide-react';
import { useAppStore, useMarketStore } from '@/lib/store';
import { fetchMarketData } from '@/lib/api';
import { formatPrice, formatVolume, formatMarketCap } from '@/lib/constants';
import type { CoinData } from '@/lib/types';
import Heatmap from '@/components/market/Heatmap';

type SortKey = 'rank' | 'price' | 'change24h' | 'volume24h' | 'marketCap';
type SortDir = 'asc' | 'desc';
type Tab = 'semua' | 'watchlist' | 'heatmap';

export default function MarketPage() {
  const { watchlist, openCoinDetail } = useAppStore();
  const { coins, loading, setCoins, setLoading, setError } = useMarketStore();

  const [tab, setTab] = useState<Tab>('semua');
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMarketData();
      setCoins(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data');
    }
  }, [setCoins, setLoading, setError]);

  useEffect(() => {
    if (coins.length === 0) {
      loadData();
    }
  }, [coins.length, loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'rank' ? 'asc' : 'desc');
    }
  };

  const filteredCoins = useMemo(() => {
    let list =
      tab === 'watchlist'
        ? coins.filter((c) => watchlist.includes(c.symbol))
        : coins;

    return [...list].sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1;
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      return (aVal - bVal) * mul;
    });
  }, [coins, tab, watchlist, sortKey, sortDir]);

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return null;
    return sortDir === 'asc' ? (
      <ChevronUp size={12} className="inline text-accent" />
    ) : (
      <ChevronDown size={12} className="inline text-accent" />
    );
  };

  return (
    <div className="px-4 py-3">
      {/* Tabs + Refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-lg bg-surface-card p-0.5">
          {(['semua', 'watchlist', 'heatmap'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                tab === t
                  ? 'bg-accent text-bg-primary'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {t === 'semua' ? 'Semua' : t === 'watchlist' ? 'Watchlist' : 'Heatmap'}
            </button>
          ))}
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="rounded-lg p-2 text-text-muted transition-colors hover:text-text-primary active:bg-surface-card"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Heatmap view */}
      {tab === 'heatmap' ? (
        <div className="mt-4">
          <Heatmap />
        </div>
      ) : (
        <>
          {/* Table Header */}
          <div className="mt-4 grid grid-cols-[32px_1fr_auto_auto] items-center gap-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted md:grid-cols-[32px_1fr_auto_auto_auto_auto]">
            <button onClick={() => toggleSort('rank')} className="text-left">
              # <SortIcon col="rank" />
            </button>
            <span className="text-left">Coin</span>
            <button onClick={() => toggleSort('price')} className="text-right">
              Harga <SortIcon col="price" />
            </button>
            <button onClick={() => toggleSort('change24h')} className="text-right">
              24h <SortIcon col="change24h" />
            </button>
            <button
              onClick={() => toggleSort('volume24h')}
              className="hidden text-right md:block"
            >
              Volume <SortIcon col="volume24h" />
            </button>
            <button
              onClick={() => toggleSort('marketCap')}
              className="hidden text-right md:block"
            >
              MCap <SortIcon col="marketCap" />
            </button>
          </div>

          {/* Coin List */}
          <div className="mt-2 flex flex-col gap-1">
            {loading && coins.length === 0 ? (
              Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="skeleton h-14 rounded-xl"
                />
              ))
            ) : tab === 'watchlist' && filteredCoins.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-16 text-center">
                <Star size={32} className="text-text-muted" />
                <p className="text-sm text-text-muted">
                  Belum ada coin di watchlist
                </p>
                <p className="text-xs text-text-muted">
                  Tap bintang pada coin untuk menambahkan
                </p>
              </div>
            ) : (
              filteredCoins.map((coin) => (
                <CoinRow
                  key={coin.symbol}
                  coin={coin}
                  onClick={() => openCoinDetail(coin.symbol)}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

function CoinRow({ coin, onClick }: { coin: CoinData; onClick: () => void }) {
  const isPositive = coin.change24h >= 0;

  return (
    <button
      onClick={onClick}
      className="grid grid-cols-[32px_1fr_auto_auto] items-center gap-2 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-surface-card active:bg-surface-card md:grid-cols-[32px_1fr_auto_auto_auto_auto]"
    >
      <span className="text-xs text-text-muted">{coin.rank}</span>

      <div className="flex items-center gap-2 overflow-hidden">
        <img
          src={coin.image}
          alt={coin.symbol}
          className="h-7 w-7 flex-shrink-0 rounded-full"
        />
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-text-primary">{coin.symbol}</p>
          <p className="truncate text-[10px] text-text-muted">{coin.name}</p>
        </div>
      </div>

      <span className="font-mono-price text-[13px] font-semibold text-text-primary">
        {formatPrice(coin.price)}
      </span>

      <span
        className={`flex items-center justify-end gap-0.5 text-xs font-semibold ${
          isPositive ? 'text-bullish' : 'text-bearish'
        }`}
      >
        {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        {Math.abs(coin.change24h).toFixed(2)}%
      </span>

      <span className="hidden font-mono-price text-xs text-text-secondary md:block">
        {formatVolume(coin.volume24h)}
      </span>

      <span className="hidden font-mono-price text-xs text-text-secondary md:block">
        {formatMarketCap(coin.marketCap)}
      </span>
    </button>
  );
}
