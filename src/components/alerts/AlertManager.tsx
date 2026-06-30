'use client';

import { useState } from 'react';
import { Trash2, ArrowUp, ArrowDown, ToggleLeft, ToggleRight, Activity } from 'lucide-react';
import BottomSheet from '@/components/ui/BottomSheet';
import { useAlertStore } from '@/lib/alerts';
import { useIndicatorAlertStore } from '@/lib/indicator-alerts';
import { formatPrice } from '@/lib/constants';

interface AlertManagerProps {
  symbol: string;
  coinId: string;
  currentPrice: number;
  isOpen: boolean;
  onClose: () => void;
}

type AlertTab = 'price' | 'indicator';

const RSI_PRESETS = [
  { label: 'Oversold (< 30)', threshold: 30, direction: 'below' as const },
  { label: 'Overbought (> 70)', threshold: 70, direction: 'above' as const },
  { label: 'Bullish Zone (> 50)', threshold: 50, direction: 'above' as const },
  { label: 'Bearish Zone (< 50)', threshold: 50, direction: 'below' as const },
];

export default function AlertManager({ symbol, coinId, currentPrice, isOpen, onClose }: AlertManagerProps) {
  const [alertTab, setAlertTab] = useState<AlertTab>('price');
  const [targetPrice, setTargetPrice] = useState(currentPrice.toString());
  const [direction, setDirection] = useState<'above' | 'below'>('above');

  const [rsiThreshold, setRsiThreshold] = useState('70');
  const [rsiDirection, setRsiDirection] = useState<'above' | 'below'>('above');

  const { addAlert, removeAlert, toggleAlert, getAlertsBySymbol } = useAlertStore();
  const {
    addAlert: addIndicatorAlert,
    removeAlert: removeIndicatorAlert,
    toggleAlert: toggleIndicatorAlert,
    getAlertsBySymbol: getIndicatorAlertsBySymbol,
  } = useIndicatorAlertStore();

  const priceAlerts = getAlertsBySymbol(symbol);
  const indicatorAlerts = getIndicatorAlertsBySymbol(symbol);

  const handleAddPriceAlert = () => {
    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) return;
    addAlert({ symbol, coinId, targetPrice: price, direction });
    setTargetPrice(currentPrice.toString());
  };

  const handleAddIndicatorAlert = () => {
    const thr = parseFloat(rsiThreshold);
    if (isNaN(thr) || thr < 0 || thr > 100) return;
    addIndicatorAlert({ symbol, coinId, indicator: 'rsi', threshold: thr, direction: rsiDirection, period: 14 });
    setRsiThreshold('70');
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={`Alert — ${symbol}`}>
      {/* Tab switcher */}
      <div className="mb-4 flex gap-1 rounded-lg bg-bg-primary p-0.5">
        {(['price', 'indicator'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setAlertTab(t)}
            className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${
              alertTab === t ? 'bg-accent text-bg-primary' : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {t === 'price' ? 'Harga' : 'Indikator'}
          </button>
        ))}
      </div>

      {/* Price Alert Form */}
      {alertTab === 'price' && (
        <>
          <div className="mb-4 rounded-xl bg-surface-card p-3">
            <p className="text-[10px] text-text-muted">Harga saat ini</p>
            <p className="font-mono-price text-lg font-bold text-text-primary">
              {formatPrice(currentPrice)}
            </p>
          </div>

          <div className="space-y-3">
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

            <div>
              <label className="mb-1 block text-[11px] font-semibold text-text-secondary">Arah</label>
              <div className="flex gap-2">
                {(['above', 'below'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDirection(d)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-colors ${
                      direction === d
                        ? d === 'above'
                          ? 'bg-bullish text-bg-primary'
                          : 'bg-bearish text-bg-primary'
                        : 'border border-border-line bg-surface-card text-text-muted'
                    }`}
                  >
                    {d === 'above' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                    {d === 'above' ? 'Di atas' : 'Di bawah'}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleAddPriceAlert}
              className="w-full rounded-xl bg-accent py-3 text-sm font-bold text-bg-primary transition-transform active:scale-[0.98]"
            >
              Set Alert
            </button>
          </div>

          {priceAlerts.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-[11px] font-semibold text-text-secondary">
                Alert Harga — {symbol}
              </p>
              <div className="space-y-2">
                {priceAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex items-center justify-between rounded-xl border border-border-line bg-surface-card p-3 ${alert.triggered ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      {alert.direction === 'above' ? (
                        <ArrowUp size={14} className="text-bullish" />
                      ) : (
                        <ArrowDown size={14} className="text-bearish" />
                      )}
                      <span className={`font-mono-price text-sm font-semibold ${alert.triggered ? 'line-through text-text-muted' : 'text-text-primary'}`}>
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
                        <button onClick={() => toggleAlert(alert.id)} className="text-text-muted">
                          {alert.active ? <ToggleRight size={20} className="text-accent" /> : <ToggleLeft size={20} />}
                        </button>
                      )}
                      <button onClick={() => removeAlert(alert.id)} className="text-text-muted hover:text-bearish">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Indicator Alert Form */}
      {alertTab === 'indicator' && (
        <>
          <div className="mb-3 rounded-xl border border-border-line bg-surface-card p-3">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-accent" />
              <p className="text-[11px] text-text-secondary">
                Alert berbasis RSI (14). Dicek setiap ~5 menit di background.
              </p>
            </div>
          </div>

          {/* RSI Presets */}
          <div className="mb-3 grid grid-cols-2 gap-2">
            {RSI_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  setRsiThreshold(p.threshold.toString());
                  setRsiDirection(p.direction);
                }}
                className={`rounded-xl border px-3 py-2 text-left transition-colors ${
                  rsiThreshold === p.threshold.toString() && rsiDirection === p.direction
                    ? 'border-accent bg-accent/10'
                    : 'border-border-line bg-surface-card hover:bg-bg-secondary'
                }`}
              >
                <p className="text-[11px] font-semibold text-text-primary">{p.label}</p>
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-text-secondary">
                  RSI Threshold
                </label>
                <input
                  type="number"
                  value={rsiThreshold}
                  onChange={(e) => setRsiThreshold(e.target.value)}
                  min="1"
                  max="99"
                  className="w-full rounded-xl border border-border-line bg-surface-card px-3 py-2.5 font-mono-price text-sm text-text-primary outline-none focus:border-accent"
                  placeholder="70"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-text-secondary">Kondisi</label>
                <div className="flex gap-1">
                  {(['above', 'below'] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setRsiDirection(d)}
                      className={`flex-1 rounded-xl py-2.5 text-[11px] font-bold transition-colors ${
                        rsiDirection === d
                          ? 'bg-accent text-bg-primary'
                          : 'border border-border-line bg-surface-card text-text-muted'
                      }`}
                    >
                      {d === 'above' ? '> Di atas' : '< Di bawah'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleAddIndicatorAlert}
              className="w-full rounded-xl bg-accent py-3 text-sm font-bold text-bg-primary transition-transform active:scale-[0.98]"
            >
              Set RSI Alert
            </button>
          </div>

          {indicatorAlerts.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-[11px] font-semibold text-text-secondary">
                Alert Indikator — {symbol}
              </p>
              <div className="space-y-2">
                {indicatorAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex items-center justify-between rounded-xl border border-border-line bg-surface-card p-3 ${alert.triggered ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <Activity size={14} className="text-accent" />
                      <span className={`text-sm font-semibold ${alert.triggered ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                        RSI {alert.direction === 'above' ? '>' : '<'} {alert.threshold}
                      </span>
                      {alert.triggered && (
                        <span className="rounded-md bg-bullish/20 px-1.5 py-0.5 text-[9px] font-bold text-bullish">
                          Triggered
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!alert.triggered && (
                        <button onClick={() => toggleIndicatorAlert(alert.id)} className="text-text-muted">
                          {alert.active ? <ToggleRight size={20} className="text-accent" /> : <ToggleLeft size={20} />}
                        </button>
                      )}
                      <button onClick={() => removeIndicatorAlert(alert.id)} className="text-text-muted hover:text-bearish">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </BottomSheet>
  );
}
