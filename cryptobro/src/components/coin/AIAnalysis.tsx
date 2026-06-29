'use client';

import { useState } from 'react';
import { Sparkles, Target, TrendingUp, TrendingDown, Minus, Loader2, AlertTriangle } from 'lucide-react';
import BottomSheet from '@/components/ui/BottomSheet';
import { formatPrice } from '@/lib/constants';
import type { IndicatorData } from '@/lib/types';

interface AIAnalysisProps {
  symbol: string;
  price: number;
  change24h: number;
  indicators: IndicatorData;
  support: number[];
  resistance: number[];
  mode: string;
  isOpen: boolean;
  onClose: () => void;
}

interface AnalysisResult {
  analysis: string;
  recommendation: 'buy' | 'sell' | 'hold';
  confidence: number;
  targets: {
    entry: number;
    tp1: number;
    tp2: number;
    stopLoss: number;
  };
}

const RECOMMENDATION_CONFIG = {
  buy: {
    label: 'BELI',
    color: 'bg-bullish text-bg-primary',
    icon: TrendingUp,
  },
  sell: {
    label: 'JUAL',
    color: 'bg-bearish text-bg-primary',
    icon: TrendingDown,
  },
  hold: {
    label: 'TAHAN',
    color: 'bg-accent text-bg-primary',
    icon: Minus,
  },
};

export default function AIAnalysis({
  symbol,
  price,
  change24h,
  indicators,
  support,
  resistance,
  mode,
  isOpen,
  onClose,
}: AIAnalysisProps) {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          price,
          change24h,
          indicators,
          support,
          resistance,
          mode,
        }),
      });

      if (!res.ok) {
        throw new Error('Gagal mengambil analisis');
      }

      const data = (await res.json()) as AnalysisResult;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  // Fetch on open if no result yet
  if (isOpen && !result && !loading && !error) {
    fetchAnalysis();
  }

  const config = result ? RECOMMENDATION_CONFIG[result.recommendation] : null;
  const RecIcon = config?.icon ?? Minus;

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={`Analisa AI - ${symbol}`}>
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 size={32} className="animate-spin text-accent" />
          <p className="mt-3 text-xs text-text-muted">Menganalisis {symbol}...</p>
          <p className="mt-1 text-[10px] text-text-muted/60">
            Mohon tunggu beberapa detik
          </p>
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center py-12">
          <AlertTriangle size={32} className="text-bearish" />
          <p className="mt-3 text-xs text-text-muted">{error}</p>
          <button
            onClick={fetchAnalysis}
            className="mt-4 rounded-xl bg-accent px-6 py-2.5 text-xs font-bold text-bg-primary"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {result && config && (
        <div className="space-y-4">
          {/* Recommendation Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 rounded-xl px-4 py-2 ${config.color}`}>
                <RecIcon size={16} />
                <span className="text-sm font-bold">{config.label}</span>
              </div>
              <div className="rounded-xl bg-surface-card px-3 py-2">
                <span className="text-[10px] text-text-muted">Confidence</span>
                <p className="font-mono-price text-sm font-bold text-text-primary">
                  {result.confidence}%
                </p>
              </div>
            </div>
            <Sparkles size={20} className="text-accent" />
          </div>

          {/* Targets Grid */}
          <div>
            <p className="mb-2 text-[11px] font-semibold text-text-secondary">
              Target Harga
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-border-line bg-surface-card p-3">
                <div className="flex items-center gap-1.5">
                  <Target size={10} className="text-accent" />
                  <span className="text-[10px] text-text-muted">Entry</span>
                </div>
                <p className="mt-1 font-mono-price text-sm font-bold text-text-primary">
                  {formatPrice(result.targets.entry)}
                </p>
              </div>
              <div className="rounded-xl border border-bullish/30 bg-bullish/5 p-3">
                <div className="flex items-center gap-1.5">
                  <TrendingUp size={10} className="text-bullish" />
                  <span className="text-[10px] text-text-muted">TP 1</span>
                </div>
                <p className="mt-1 font-mono-price text-sm font-bold text-bullish">
                  {formatPrice(result.targets.tp1)}
                </p>
              </div>
              <div className="rounded-xl border border-bullish/30 bg-bullish/5 p-3">
                <div className="flex items-center gap-1.5">
                  <TrendingUp size={10} className="text-bullish" />
                  <span className="text-[10px] text-text-muted">TP 2</span>
                </div>
                <p className="mt-1 font-mono-price text-sm font-bold text-bullish">
                  {formatPrice(result.targets.tp2)}
                </p>
              </div>
              <div className="rounded-xl border border-bearish/30 bg-bearish/5 p-3">
                <div className="flex items-center gap-1.5">
                  <TrendingDown size={10} className="text-bearish" />
                  <span className="text-[10px] text-text-muted">Stop Loss</span>
                </div>
                <p className="mt-1 font-mono-price text-sm font-bold text-bearish">
                  {formatPrice(result.targets.stopLoss)}
                </p>
              </div>
            </div>
          </div>

          {/* Analysis Text */}
          <div>
            <p className="mb-2 text-[11px] font-semibold text-text-secondary">
              Analisis Detail
            </p>
            <div className="rounded-xl border border-border-line bg-surface-card p-3">
              <p className="whitespace-pre-line text-xs leading-relaxed text-text-secondary">
                {result.analysis}
              </p>
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-center text-[9px] text-text-muted/50">
            Analisis ini dihasilkan oleh AI dan bukan merupakan saran investasi.
            Selalu lakukan riset mandiri sebelum mengambil keputusan trading.
          </p>

          {/* Refresh Button */}
          <button
            onClick={fetchAnalysis}
            className="w-full rounded-xl border border-border-line bg-surface-card py-3 text-xs font-semibold text-text-secondary transition-colors hover:bg-surface-card/80"
          >
            Analisis Ulang
          </button>
        </div>
      )}
    </BottomSheet>
  );
}
