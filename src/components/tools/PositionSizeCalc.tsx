'use client';

import { useState } from 'react';
import { Calculator, Target, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import BottomSheet from '@/components/ui/BottomSheet';
import { formatPrice } from '@/lib/constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function PositionSizeCalc({ isOpen, onClose }: Props) {
  const [account, setAccount] = useState('10000');
  const [riskPct, setRiskPct] = useState('2');
  const [entry, setEntry] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');

  const accountNum = parseFloat(account) || 0;
  const riskPctNum = parseFloat(riskPct) || 0;
  const entryNum = parseFloat(entry) || 0;
  const slNum = parseFloat(stopLoss) || 0;
  const tpNum = parseFloat(takeProfit) || 0;

  const riskAmount = accountNum * (riskPctNum / 100);
  const slDistance = entryNum > 0 && slNum > 0 ? Math.abs(entryNum - slNum) : 0;
  const slPct = entryNum > 0 && slDistance > 0 ? (slDistance / entryNum) * 100 : 0;
  const positionSizeUSD = slDistance > 0 ? riskAmount / slPct * 100 : 0;
  const positionUnits = entryNum > 0 && positionSizeUSD > 0 ? positionSizeUSD / entryNum : 0;
  const rrRatio = tpNum > 0 && slDistance > 0 ? Math.abs(tpNum - entryNum) / slDistance : 0;

  const isLong = slNum < entryNum;
  const hasResult = positionSizeUSD > 0 && positionUnits > 0;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Position Size Calculator">
      <div className="space-y-4">
        {/* Account + Risk */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-text-secondary">
              Modal (USD)
            </label>
            <input
              type="number"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="w-full rounded-xl border border-border-line bg-surface-card px-3 py-2.5 font-mono-price text-sm text-text-primary outline-none focus:border-accent"
              placeholder="10000"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-text-secondary">
              Risk (%)
            </label>
            <input
              type="number"
              value={riskPct}
              onChange={(e) => setRiskPct(e.target.value)}
              step="0.5"
              min="0.1"
              max="10"
              className="w-full rounded-xl border border-border-line bg-surface-card px-3 py-2.5 font-mono-price text-sm text-text-primary outline-none focus:border-accent"
              placeholder="2"
            />
          </div>
        </div>

        {/* Risk % quick picks */}
        <div className="flex gap-2">
          {['0.5', '1', '2', '3', '5'].map((r) => (
            <button
              key={r}
              onClick={() => setRiskPct(r)}
              className={`flex-1 rounded-lg py-1.5 text-[11px] font-bold transition-colors ${
                riskPct === r
                  ? 'bg-accent text-bg-primary'
                  : 'border border-border-line bg-surface-card text-text-muted hover:text-text-secondary'
              }`}
            >
              {r}%
            </button>
          ))}
        </div>

        {/* Price Inputs */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-text-secondary">
              Entry
            </label>
            <input
              type="number"
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              step="any"
              className="w-full rounded-xl border border-border-line bg-surface-card px-3 py-2.5 font-mono-price text-xs text-text-primary outline-none focus:border-accent"
              placeholder="0"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-bearish">
              Stop Loss
            </label>
            <input
              type="number"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              step="any"
              className="w-full rounded-xl border border-bearish/40 bg-bearish/5 px-3 py-2.5 font-mono-price text-xs text-text-primary outline-none focus:border-bearish"
              placeholder="0"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-bullish">
              Take Profit
            </label>
            <input
              type="number"
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              step="any"
              className="w-full rounded-xl border border-bullish/40 bg-bullish/5 px-3 py-2.5 font-mono-price text-xs text-text-primary outline-none focus:border-bullish"
              placeholder="optional"
            />
          </div>
        </div>

        {/* Results */}
        {hasResult ? (
          <div className="space-y-3">
            <div
              className={`flex items-center gap-2 rounded-xl border px-4 py-3 ${
                isLong
                  ? 'border-bullish/30 bg-bullish/10'
                  : 'border-bearish/30 bg-bearish/10'
              }`}
            >
              {isLong ? (
                <TrendingUp size={16} className="text-bullish" />
              ) : (
                <TrendingDown size={16} className="text-bearish" />
              )}
              <span className={`text-sm font-bold ${isLong ? 'text-bullish' : 'text-bearish'}`}>
                {isLong ? 'LONG' : 'SHORT'} — SL {slPct.toFixed(2)}% dari entry
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-border-line bg-surface-card p-3">
                <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
                  <Calculator size={10} />
                  <span>Ukuran Posisi</span>
                </div>
                <p className="mt-1 font-mono-price text-base font-bold text-text-primary">
                  {formatPrice(positionSizeUSD)}
                </p>
                <p className="text-[10px] text-text-muted">
                  {positionSizeUSD > accountNum ? (
                    <span className="text-bearish">⚠ Melebihi modal</span>
                  ) : (
                    `${((positionSizeUSD / accountNum) * 100).toFixed(1)}% dari modal`
                  )}
                </p>
              </div>

              <div className="rounded-xl border border-border-line bg-surface-card p-3">
                <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
                  <Target size={10} />
                  <span>Jumlah Unit</span>
                </div>
                <p className="mt-1 font-mono-price text-base font-bold text-text-primary">
                  {positionUnits < 0.001
                    ? positionUnits.toExponential(3)
                    : positionUnits.toFixed(positionUnits < 1 ? 4 : 2)}
                </p>
                <p className="text-[10px] text-text-muted">units @ {formatPrice(entryNum)}</p>
              </div>

              <div className="rounded-xl border border-bearish/30 bg-bearish/5 p-3">
                <div className="flex items-center gap-1.5 text-[10px] text-bearish">
                  <AlertTriangle size={10} />
                  <span>Risiko Maks</span>
                </div>
                <p className="mt-1 font-mono-price text-base font-bold text-bearish">
                  {formatPrice(riskAmount)}
                </p>
                <p className="text-[10px] text-text-muted">{riskPctNum}% dari modal</p>
              </div>

              {rrRatio > 0 && (
                <div className="rounded-xl border border-bullish/30 bg-bullish/5 p-3">
                  <div className="flex items-center gap-1.5 text-[10px] text-bullish">
                    <TrendingUp size={10} />
                    <span>Risk:Reward</span>
                  </div>
                  <p className="mt-1 font-mono-price text-base font-bold text-bullish">
                    1 : {rrRatio.toFixed(2)}
                  </p>
                  <p className={`text-[10px] ${rrRatio >= 2 ? 'text-bullish' : 'text-bearish'}`}>
                    {rrRatio >= 3 ? 'Sangat Baik' : rrRatio >= 2 ? 'Baik' : rrRatio >= 1 ? 'Minimal' : 'Buruk'}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-border-line bg-surface-card py-8 text-center">
            <Calculator size={24} className="text-text-muted" />
            <p className="text-xs text-text-muted">
              Masukkan Entry dan Stop Loss untuk menghitung ukuran posisi
            </p>
          </div>
        )}

        <p className="text-center text-[9px] text-text-muted/50">
          Kalkulasi ini hanya untuk referensi. Selalu gunakan manajemen risiko yang tepat.
        </p>
      </div>
    </BottomSheet>
  );
}
