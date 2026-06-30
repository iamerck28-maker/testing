'use client';

import { useState, useMemo } from 'react';
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useMarketStore } from '@/lib/store';
import { usePortfolioStore } from '@/lib/portfolio';
import { formatPrice, formatMarketCap } from '@/lib/constants';
import AddHoldingSheet from '@/components/portfolio/AddHoldingSheet';

function formatUSD(value: number): string {
  if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (Math.abs(value) >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

export default function PortfolioPage() {
  const { coins } = useMarketStore();
  const { holdings, removeHolding, getTotalValue, getTotalPnL } = usePortfolioStore();
  const [sheetOpen, setSheetOpen] = useState(false);

  const prices = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of coins) map[c.symbol] = c.price;
    return map;
  }, [coins]);

  const coinMap = useMemo(() => {
    const map: Record<string, (typeof coins)[0]> = {};
    for (const c of coins) map[c.symbol] = c;
    return map;
  }, [coins]);

  const totalValue = getTotalValue(prices);
  const { pnl, pnlPct } = getTotalPnL(prices);

  const portfolio24hChange = useMemo(() => {
    if (holdings.length === 0 || totalValue === 0) return 0;
    let weightedChange = 0;
    for (const h of holdings) {
      const coin = coinMap[h.symbol];
      if (!coin) continue;
      const holdingValue = h.amount * (prices[h.symbol] ?? 0);
      const weight = holdingValue / totalValue;
      weightedChange += coin.change24h * weight;
    }
    return weightedChange;
  }, [holdings, coinMap, prices, totalValue]);

  const isPnlPositive = pnl >= 0;
  const is24hPositive = portfolio24hChange >= 0;

  return (
    <div className="px-4 py-3">
      {/* Summary Header */}
      <div className="rounded-2xl border border-border-line bg-surface-card p-4 mb-4">
        <p className="text-xs font-semibold text-text-muted mb-1">Total Portfolio</p>
        <p className="font-mono-price text-3xl font-bold text-text-primary tracking-tight">
          {formatUSD(totalValue)}
        </p>

        <div className="mt-3 flex items-center gap-4">
          {/* Total P&L */}
          <div className="flex-1">
            <p className="text-[10px] text-text-muted mb-0.5">Total P&L</p>
            <div className={`flex items-center gap-1 ${isPnlPositive ? 'text-bullish' : 'text-bearish'}`}>
              {isPnlPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span className="font-mono-price text-sm font-bold">
                {isPnlPositive ? '+' : ''}{formatUSD(pnl)}
              </span>
              <span className="text-xs">
                ({isPnlPositive ? '+' : ''}{pnlPct.toFixed(2)}%)
              </span>
            </div>
          </div>

          {/* 24h Change */}
          <div className="flex-1">
            <p className="text-[10px] text-text-muted mb-0.5">24h</p>
            <div className={`flex items-center gap-1 ${is24hPositive ? 'text-bullish' : 'text-bearish'}`}>
              {is24hPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span className="font-mono-price text-sm font-bold">
                {is24hPositive ? '+' : ''}{portfolio24hChange.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Holdings List */}
      {holdings.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border-line bg-surface-card">
            <Wallet size={28} className="text-text-muted" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">
              Belum ada portfolio
            </p>
            <p className="mt-1 text-xs text-text-muted">
              Tambah holding pertamamu!
            </p>
          </div>
          <button
            onClick={() => setSheetOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-bg-primary"
          >
            <Plus size={16} />
            Tambah Holding
          </button>
        </div>
      ) : (
        <>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-secondary">
              Holdings ({holdings.length})
            </h2>
          </div>

          <div className="flex flex-col gap-2 mb-24">
            {holdings.map((holding) => {
              const coin = coinMap[holding.symbol];
              const currentPrice = prices[holding.symbol] ?? 0;
              const currentValue = holding.amount * currentPrice;
              const cost = holding.amount * holding.buyPrice;
              const holdingPnl = currentValue - cost;
              const holdingPnlPct = cost > 0 ? (holdingPnl / cost) * 100 : 0;
              const isHoldingPositive = holdingPnl >= 0;

              return (
                <div
                  key={holding.id}
                  className="rounded-xl border border-border-line bg-surface-card p-3"
                >
                  <div className="flex items-start gap-3">
                    {/* Coin image */}
                    {coin ? (
                      <img
                        src={coin.image}
                        alt={holding.symbol}
                        className="h-9 w-9 flex-shrink-0 rounded-full mt-0.5"
                      />
                    ) : (
                      <div className="h-9 w-9 flex-shrink-0 rounded-full bg-bg-secondary" />
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <span className="text-sm font-bold text-text-primary">
                            {holding.symbol}
                          </span>
                          <span className="ml-1.5 text-xs text-text-muted">
                            {coin?.name ?? holding.symbol}
                          </span>
                        </div>
                        <button
                          onClick={() => removeHolding(holding.id)}
                          className="ml-2 flex-shrink-0 rounded-lg p-1.5 text-text-muted transition-colors hover:bg-bg-primary hover:text-bearish"
                          aria-label="Hapus holding"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        {/* Amount & value */}
                        <div>
                          <p className="text-text-muted">Jumlah</p>
                          <p className="font-mono-price font-semibold text-text-primary">
                            {holding.amount.toLocaleString('en-US', { maximumFractionDigits: 8 })} {holding.symbol}
                          </p>
                        </div>
                        <div>
                          <p className="text-text-muted">Nilai Saat Ini</p>
                          <p className="font-mono-price font-semibold text-text-primary">
                            {formatUSD(currentValue)}
                          </p>
                        </div>

                        {/* Buy price vs current */}
                        <div>
                          <p className="text-text-muted">Harga Beli</p>
                          <p className="font-mono-price font-semibold text-text-secondary">
                            {formatPrice(holding.buyPrice)}
                          </p>
                        </div>
                        <div>
                          <p className="text-text-muted">Harga Saat Ini</p>
                          <p className="font-mono-price font-semibold text-text-secondary">
                            {currentPrice > 0 ? formatPrice(currentPrice) : '-'}
                          </p>
                        </div>
                      </div>

                      {/* P&L row */}
                      <div className={`mt-2 flex items-center gap-1.5 text-xs font-semibold ${isHoldingPositive ? 'text-bullish' : 'text-bearish'}`}>
                        {isHoldingPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        <span>
                          {isHoldingPositive ? '+' : ''}{formatUSD(holdingPnl)}
                        </span>
                        <span className="text-[11px]">
                          ({isHoldingPositive ? '+' : ''}{holdingPnlPct.toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* FAB */}
      {holdings.length > 0 && (
        <button
          onClick={() => setSheetOpen(true)}
          className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent shadow-lg transition-transform hover:scale-105 active:scale-95 md:bottom-8"
          aria-label="Tambah holding"
        >
          <Plus size={24} className="text-bg-primary" />
        </button>
      )}

      <AddHoldingSheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  );
}
