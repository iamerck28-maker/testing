'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Info } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { MODE_CONFIG, SCANNERS } from '@/lib/constants';
import type { TradingMode, MarketType, ValidationStat } from '@/lib/types';

const MOCK_VALIDATION: ValidationStat[] = SCANNERS.slice(0, 6).map((s) => ({
  scanner: s.name,
  total: Math.floor(Math.random() * 80) + 20,
  wins: Math.floor(Math.random() * 50) + 10,
  losses: Math.floor(Math.random() * 20) + 5,
  pending: Math.floor(Math.random() * 10) + 1,
  winRate: parseFloat((50 + Math.random() * 35).toFixed(1)),
}));

const TOTAL_RESOLVED = MOCK_VALIDATION.reduce((a, b) => a + b.wins + b.losses, 0);
const TOTAL_PENDING = MOCK_VALIDATION.reduce((a, b) => a + b.pending, 0);
const AVG_WIN_RATE =
  MOCK_VALIDATION.reduce((a, b) => a + b.winRate, 0) / MOCK_VALIDATION.length;

const SCORE_GUIDE = [
  { range: '80-100', label: 'Sangat Kuat', color: '#b6ff00', desc: 'Konfluensi tinggi, risiko rendah' },
  { range: '60-79', label: 'Kuat', color: '#0ecb81', desc: 'Sinyal valid, layak dipertimbangkan' },
  { range: '40-59', label: 'Sedang', color: '#f5a524', desc: 'Butuh konfirmasi tambahan' },
  { range: '0-39', label: 'Lemah', color: '#f6465d', desc: 'Hindari atau tunggu' },
];

export default function ProfilePage() {
  const { mode, setMode, marketType, setMarketType } = useAppStore();
  const [guideOpen, setGuideOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  const tradingModes: TradingMode[] = ['scalping', 'intraday', 'swing'];
  const marketTypes: MarketType[] = ['spot', 'futures'];

  return (
    <div className="px-4 py-3">
      {/* Mode Selector */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-text-secondary">
          Trading Mode
        </h2>
        <div className="flex gap-2">
          {tradingModes.map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 rounded-xl px-3 py-3 text-center transition-colors ${
                mode === m
                  ? 'bg-accent text-bg-primary'
                  : 'border border-border-line bg-surface-card text-text-muted hover:text-text-secondary'
              }`}
            >
              <p className="text-xs font-bold">{MODE_CONFIG[m].label}</p>
              <p
                className={`mt-0.5 text-[10px] ${
                  mode === m ? 'text-bg-primary/70' : 'text-text-muted'
                }`}
              >
                {MODE_CONFIG[m].description}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Market Type */}
      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-text-secondary">
          Market Type
        </h2>
        <div className="flex items-center gap-2 rounded-xl bg-surface-card p-1">
          {marketTypes.map((t) => (
            <button
              key={t}
              onClick={() => setMarketType(t)}
              className={`flex-1 rounded-lg py-2 text-xs font-bold capitalize transition-colors ${
                marketType === t
                  ? 'bg-accent text-bg-primary'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-text-muted">
          {marketType === 'spot'
            ? 'Analisis untuk pasar spot, tanpa leverage'
            : 'Analisis termasuk funding rate, open interest, dan liquidation levels'}
        </p>
      </section>

      {/* Validation Lab */}
      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-text-secondary">
          Validation Lab
        </h2>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-border-line bg-surface-card p-3 text-center">
            <p className="font-mono-price text-lg font-bold text-accent">
              {AVG_WIN_RATE.toFixed(1)}%
            </p>
            <p className="text-[10px] text-text-muted">Avg Win Rate</p>
          </div>
          <div className="rounded-xl border border-border-line bg-surface-card p-3 text-center">
            <p className="font-mono-price text-lg font-bold text-bullish">
              {TOTAL_RESOLVED}
            </p>
            <p className="text-[10px] text-text-muted">Resolved</p>
          </div>
          <div className="rounded-xl border border-border-line bg-surface-card p-3 text-center">
            <p className="font-mono-price text-lg font-bold text-neutral">
              {TOTAL_PENDING}
            </p>
            <p className="text-[10px] text-text-muted">Pending</p>
          </div>
        </div>

        {/* Summary bar chart */}
        <div className="mt-4 rounded-xl border border-border-line bg-surface-card p-3">
          <p className="mb-3 text-[11px] font-semibold text-text-secondary">
            Win Rate per Scanner
          </p>
          <div className="flex flex-col gap-2.5">
            {MOCK_VALIDATION.map((stat) => (
              <div key={stat.scanner}>
                <div className="mb-1 flex items-center justify-between text-[10px]">
                  <span className="text-text-secondary">{stat.scanner}</span>
                  <span className="font-mono-price font-semibold text-text-primary">
                    {stat.winRate}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-bg-primary">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${stat.winRate}%`,
                      backgroundColor:
                        stat.winRate >= 70
                          ? '#0ecb81'
                          : stat.winRate >= 50
                            ? '#f5a524'
                            : '#f6465d',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stat cards per scanner */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          {MOCK_VALIDATION.map((stat) => (
            <div
              key={stat.scanner}
              className="rounded-xl border border-border-line bg-surface-card p-3"
            >
              <p className="text-[11px] font-bold text-text-primary">
                {stat.scanner}
              </p>
              <div className="mt-2 flex items-center gap-3 text-[10px]">
                <span className="text-bullish">W: {stat.wins}</span>
                <span className="text-bearish">L: {stat.losses}</span>
                <span className="text-neutral">P: {stat.pending}</span>
              </div>
              <p className="mt-1 font-mono-price text-xs font-semibold text-text-primary">
                {stat.winRate}% WR
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Panduan Skor */}
      <section className="mt-6">
        <button
          onClick={() => setGuideOpen(!guideOpen)}
          className="flex w-full items-center justify-between rounded-xl border border-border-line bg-surface-card p-3 transition-colors active:bg-bg-secondary"
        >
          <div className="flex items-center gap-2">
            <Info size={16} className="text-accent" />
            <span className="text-sm font-semibold text-text-primary">
              Panduan Skor
            </span>
          </div>
          {guideOpen ? (
            <ChevronDown size={16} className="text-text-muted" />
          ) : (
            <ChevronRight size={16} className="text-text-muted" />
          )}
        </button>
        {guideOpen && (
          <div className="mt-2 flex flex-col gap-2">
            {SCORE_GUIDE.map((g) => (
              <div
                key={g.range}
                className="flex items-center gap-3 rounded-xl border border-border-line bg-surface-card p-3"
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-[11px] font-bold"
                  style={{
                    color: g.color,
                    backgroundColor: `${g.color}1a`,
                  }}
                >
                  {g.range.split('-')[0]}
                </div>
                <div>
                  <p className="text-xs font-bold text-text-primary">
                    {g.range} - {g.label}
                  </p>
                  <p className="text-[10px] text-text-muted">{g.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Tentang */}
      <section className="mt-6 mb-8">
        <button
          onClick={() => setAboutOpen(!aboutOpen)}
          className="flex w-full items-center justify-between rounded-xl border border-border-line bg-surface-card p-3 transition-colors active:bg-bg-secondary"
        >
          <span className="text-sm font-semibold text-text-primary">Tentang</span>
          {aboutOpen ? (
            <ChevronDown size={16} className="text-text-muted" />
          ) : (
            <ChevronRight size={16} className="text-text-muted" />
          )}
        </button>
        {aboutOpen && (
          <div className="mt-2 rounded-xl border border-border-line bg-surface-card p-4">
            <p className="text-lg font-bold text-accent">CryptoBro</p>
            <p className="mt-1 text-xs text-text-muted">v2.0.0</p>
            <p className="mt-3 text-[11px] leading-relaxed text-text-secondary">
              Aplikasi analisa trading crypto dengan scanner canggih untuk
              membantu trader menemukan peluang terbaik. Didukung oleh data
              real-time dan algoritma deteksi pola.
            </p>
            <div className="mt-4 border-t border-border-line pt-3">
              <p className="text-[10px] text-text-muted">
                Data disediakan oleh CoinGecko API
              </p>
              <p className="mt-1 text-[10px] text-text-muted">
                Disclaimer: Bukan saran investasi. Lakukan riset Anda sendiri.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
