'use client';

import { useState } from 'react';
import { Trash2, ArrowUp, ArrowDown, ToggleLeft, ToggleRight } from 'lucide-react';
import BottomSheet from '@/components/ui/BottomSheet';
import { useAlertStore } from '@/lib/alerts';
import { formatPrice } from '@/lib/constants';

interface AlertManagerProps {
  symbol: string;
  currentPrice: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function AlertManager({ symbol, currentPrice, isOpen, onClose }: AlertManagerProps) {
  const [targetPrice, setTargetPrice] = useState(currentPrice.toString());
  const [direction, setDirection] = useState<'above' | 'below'>('above');
  const { addAlert, removeAlert, toggleAlert, getAlertsBySymbol } = useAlertStore();

  const alerts = getAlertsBySymbol(symbol);

  const handleAddAlert = () => {
    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) return;
    addAlert({ symbol, targetPrice: price, direction });
    setTargetPrice(currentPrice.toString());
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={`Alert ${symbol}`}>
      {/* Current Price */}
      <div className="mb-4 rounded-xl bg-surface-card p-3">
        <p className="text-[10px] text-text-muted">Harga saat ini</p>
        <p className="font-mono-price text-lg font-bold text-text-primary">
          {formatPrice(currentPrice)}
        </p>
      </div>

      {/* Alert Form */}
      <div className="space-y-3">
        {/* Target Price Input */}
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-text-secondary">
            Target Harga
          </label>
          <input
            type="number"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            step="any"
            className="w-full rounded-xl border border-border-line bg-surface-card px-4 py-3 font-mono-price text-sm text-text-primary outline-none focus:border-accent"
            placeholder="Masukkan target harga"
          />
        </div>

        {/* Direction Toggle */}
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-text-secondary">
            Arah
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setDirection('above')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-colors ${
                direction === 'above'
                  ? 'bg-bullish text-bg-primary'
                  : 'border border-border-line bg-surface-card text-text-muted'
              }`}
            >
              <ArrowUp size={14} />
              Di atas
            </button>
            <button
              onClick={() => setDirection('below')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-colors ${
                direction === 'below'
                  ? 'bg-bearish text-bg-primary'
                  : 'border border-border-line bg-surface-card text-text-muted'
              }`}
            >
              <ArrowDown size={14} />
              Di bawah
            </button>
          </div>
        </div>

        {/* Add Button */}
        <button
          onClick={handleAddAlert}
          className="w-full rounded-xl bg-accent py-3 text-sm font-bold text-bg-primary transition-transform active:scale-[0.98]"
        >
          Set Alert
        </button>
      </div>

      {/* Existing Alerts */}
      {alerts.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-[11px] font-semibold text-text-secondary">
            Alert untuk {symbol}
          </p>
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-center justify-between rounded-xl border p-3 ${
                  alert.triggered
                    ? 'border-border-line bg-surface-card opacity-60'
                    : 'border-border-line bg-surface-card'
                }`}
              >
                <div className="flex items-center gap-2">
                  {alert.direction === 'above' ? (
                    <ArrowUp size={14} className="text-bullish" />
                  ) : (
                    <ArrowDown size={14} className="text-bearish" />
                  )}
                  <span
                    className={`font-mono-price text-sm font-semibold ${
                      alert.triggered ? 'line-through text-text-muted' : 'text-text-primary'
                    }`}
                  >
                    {formatPrice(alert.targetPrice)}
                  </span>
                  {alert.triggered && (
                    <span className="rounded-md bg-bullish/20 px-1.5 py-0.5 text-[9px] font-bold text-bullish">
                      Triggered
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!alert.triggered && (
                    <button
                      onClick={() => toggleAlert(alert.id)}
                      className="text-text-muted transition-colors hover:text-text-secondary"
                    >
                      {alert.active ? (
                        <ToggleRight size={20} className="text-accent" />
                      ) : (
                        <ToggleLeft size={20} />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => removeAlert(alert.id)}
                    className="text-text-muted transition-colors hover:text-bearish"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
