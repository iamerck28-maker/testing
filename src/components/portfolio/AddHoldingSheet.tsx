'use client';

import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { useMarketStore } from '@/lib/store';
import { usePortfolioStore } from '@/lib/portfolio';
import { formatPrice } from '@/lib/constants';
import type { CoinData } from '@/lib/types';

interface AddHoldingSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddHoldingSheet({ isOpen, onClose }: AddHoldingSheetProps) {
  const { coins } = useMarketStore();
  const { addHolding } = usePortfolioStore();

  const [query, setQuery] = useState('');
  const [selectedCoin, setSelectedCoin] = useState<CoinData | null>(null);
  const [amount, setAmount] = useState('');
  const [buyPrice, setBuyPrice] = useState('');

  const filteredCoins = useMemo(() => {
    if (!query.trim()) return coins.slice(0, 20);
    const q = query.toLowerCase();
    return coins.filter(
      (c) =>
        c.symbol.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [coins, query]);

  const handleSelectCoin = (coin: CoinData) => {
    setSelectedCoin(coin);
    setBuyPrice(coin.price.toString());
    setAmount('');
  };

  const handleAdd = () => {
    if (!selectedCoin) return;
    const amt = parseFloat(amount);
    const price = parseFloat(buyPrice);
    if (isNaN(amt) || amt <= 0 || isNaN(price) || price <= 0) return;

    addHolding(selectedCoin.symbol, amt, price);
    handleClose();
  };

  const handleClose = () => {
    setQuery('');
    setSelectedCoin(null);
    setAmount('');
    setBuyPrice('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
        onClick={handleClose}
      />

      {/* Sheet */}
      <div className="slide-up absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-hidden rounded-t-[20px] bg-bg-secondary md:bottom-auto md:left-1/2 md:top-1/2 md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[20px]">
        {/* Handle bar */}
        <div className="flex justify-center py-3 md:hidden">
          <div className="h-1 w-9 rounded-full bg-text-muted/40" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-line px-4 pb-3 md:pt-4">
          <h2 className="text-base font-semibold text-text-primary">Tambah Holding</h2>
          <button
            onClick={handleClose}
            className="text-text-muted hover:text-text-primary"
            aria-label="Tutup"
          >
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-4" style={{ maxHeight: 'calc(85vh - 100px)' }}>
          {!selectedCoin ? (
            /* Coin search */
            <>
              <div className="relative mb-3">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  type="text"
                  placeholder="Cari coin..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                  className="w-full rounded-xl border border-border-line bg-bg-primary py-2.5 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                {filteredCoins.map((coin) => (
                  <button
                    key={coin.symbol}
                    onClick={() => handleSelectCoin(coin)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-surface-card active:bg-surface-card"
                  >
                    <img
                      src={coin.image}
                      alt={coin.symbol}
                      className="h-8 w-8 flex-shrink-0 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-text-primary">{coin.symbol}</p>
                      <p className="truncate text-xs text-text-muted">{coin.name}</p>
                    </div>
                    <span className="font-mono-price text-sm text-text-secondary">
                      {formatPrice(coin.price)}
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            /* Holding input form */
            <>
              {/* Selected coin header */}
              <div className="mb-4 flex items-center gap-3 rounded-xl border border-border-line bg-surface-card p-3">
                <img
                  src={selectedCoin.image}
                  alt={selectedCoin.symbol}
                  className="h-10 w-10 rounded-full"
                />
                <div className="flex-1">
                  <p className="font-bold text-text-primary">{selectedCoin.symbol}</p>
                  <p className="text-xs text-text-muted">{selectedCoin.name}</p>
                </div>
                <button
                  onClick={() => setSelectedCoin(null)}
                  className="text-xs text-accent"
                >
                  Ganti
                </button>
              </div>

              {/* Amount input */}
              <div className="mb-3">
                <label className="mb-1.5 block text-xs font-semibold text-text-secondary">
                  Jumlah ({selectedCoin.symbol})
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  step="any"
                  className="w-full rounded-xl border border-border-line bg-bg-primary py-2.5 px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
                />
              </div>

              {/* Buy price input */}
              <div className="mb-6">
                <label className="mb-1.5 block text-xs font-semibold text-text-secondary">
                  Harga Beli (USD)
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value)}
                  min="0"
                  step="any"
                  className="w-full rounded-xl border border-border-line bg-bg-primary py-2.5 px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-text-muted">
                  Harga saat ini: {formatPrice(selectedCoin.price)}
                </p>
              </div>

              {/* Preview */}
              {amount && buyPrice && (
                <div className="mb-6 rounded-xl border border-border-line bg-surface-card p-3 text-xs">
                  <div className="flex justify-between mb-1">
                    <span className="text-text-muted">Total cost</span>
                    <span className="font-mono-price text-text-primary">
                      ${(parseFloat(amount) * parseFloat(buyPrice)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Nilai saat ini</span>
                    <span className="font-mono-price text-text-primary">
                      ${(parseFloat(amount) * selectedCoin.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={handleAdd}
                disabled={!amount || !buyPrice || parseFloat(amount) <= 0 || parseFloat(buyPrice) <= 0}
                className="w-full rounded-xl bg-accent py-3 text-sm font-bold text-bg-primary transition-opacity disabled:opacity-40"
              >
                Tambah ke Portfolio
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
