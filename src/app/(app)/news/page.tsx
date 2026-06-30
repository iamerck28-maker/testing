'use client';

import { useEffect, useState } from 'react';
import { Sparkles, Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { fetchNews } from '@/lib/api';
import { timeAgo } from '@/lib/constants';
import type { NewsArticle } from '@/lib/types';

type NewsTab = 'crypto' | 'macro' | 'event';

const SENTIMENT_DOT: Record<string, string> = {
  positive: 'bg-bullish',
  negative: 'bg-bearish',
  neutral: 'bg-text-muted',
};

const MACRO_CARDS = [
  {
    label: 'Fed Rate',
    value: '5.25-5.50%',
    change: 'Hold',
    sentiment: 'neutral' as const,
    icon: TrendingDown,
  },
  {
    label: 'CPI (YoY)',
    value: '3.2%',
    change: '-0.1%',
    sentiment: 'positive' as const,
    icon: TrendingDown,
  },
  {
    label: '10Y Yield',
    value: '4.28%',
    change: '+0.05%',
    sentiment: 'negative' as const,
    icon: TrendingUp,
  },
  {
    label: 'Unemployment',
    value: '3.8%',
    change: '+0.1%',
    sentiment: 'neutral' as const,
    icon: Minus,
  },
];

const MOCK_EVENTS = [
  { id: 'e1', date: '2026-07-01', title: 'Ethereum Pectra Upgrade', category: 'Network', impact: 'high' as const },
  { id: 'e2', date: '2026-07-03', title: 'FOMC Meeting Minutes', category: 'Macro', impact: 'high' as const },
  { id: 'e3', date: '2026-07-05', title: 'Solana Breakpoint Conference', category: 'Community', impact: 'medium' as const },
  { id: 'e4', date: '2026-07-08', title: 'Bitcoin ETF Options Expiry', category: 'Market', impact: 'high' as const },
  { id: 'e5', date: '2026-07-10', title: 'US CPI Data Release', category: 'Macro', impact: 'high' as const },
  { id: 'e6', date: '2026-07-12', title: 'Cardano Governance Vote', category: 'Network', impact: 'medium' as const },
  { id: 'e7', date: '2026-07-15', title: 'Binance Monthly Token Burn', category: 'Market', impact: 'medium' as const },
  { id: 'e8', date: '2026-07-17', title: 'Ripple SEC Ruling Update', category: 'Regulasi', impact: 'high' as const },
  { id: 'e9', date: '2026-07-20', title: 'Polygon zkEVM Upgrade', category: 'Network', impact: 'medium' as const },
  { id: 'e10', date: '2026-07-22', title: 'US FOMC Rate Decision', category: 'Macro', impact: 'high' as const },
  { id: 'e11', date: '2026-07-24', title: 'Chainlink SmartCon 2026', category: 'Community', impact: 'medium' as const },
  { id: 'e12', date: '2026-07-26', title: 'Avalanche Summit LATAM', category: 'Community', impact: 'low' as const },
  { id: 'e13', date: '2026-07-28', title: 'Bitcoin CME Futures Expiry', category: 'Market', impact: 'high' as const },
  { id: 'e14', date: '2026-07-30', title: 'Uniswap v4 Mainnet Launch', category: 'Network', impact: 'high' as const },
  { id: 'e15', date: '2026-08-01', title: 'US Nonfarm Payrolls', category: 'Macro', impact: 'medium' as const },
];

type EventCategory = 'Semua' | 'Macro' | 'Network' | 'Market' | 'Community' | 'Regulasi';

function getCountdown(dateStr: string): string {
  const now = new Date();
  const eventDate = new Date(dateStr);
  const diffMs = eventDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / 86_400_000);
  if (diffDays < 0) return 'Selesai';
  if (diffDays === 0) return 'Hari ini!';
  if (diffDays === 1) return 'Besok';
  return `${diffDays} hari lagi`;
}

const IMPACT_COLORS = {
  high: 'bg-bearish/15 text-bearish',
  medium: 'bg-neutral/15 text-neutral',
  low: 'bg-text-muted/15 text-text-muted',
};

export default function NewsPage() {
  const [tab, setTab] = useState<NewsTab>('crypto');
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventFilter, setEventFilter] = useState<EventCategory>('Semua');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchNews()
      .then((data) => {
        if (!cancelled) {
          setArticles(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="px-4 py-3">
      {/* Tab Bar */}
      <div className="flex items-center gap-1 rounded-lg bg-surface-card p-0.5">
        {(['crypto', 'macro', 'event'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
              tab === t
                ? 'bg-accent text-bg-primary'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {t === 'crypto' ? 'Crypto' : t === 'macro' ? 'Macro' : 'Event'}
          </button>
        ))}
      </div>

      {/* Crypto Tab */}
      {tab === 'crypto' && (
        <div className="mt-4 flex flex-col gap-2">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-20 rounded-xl" />
              ))
            : articles.map((article) => (
                <a
                  key={article.id}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex gap-3 rounded-xl border border-border-line bg-surface-card p-3 transition-colors active:bg-bg-secondary"
                >
                  <div className="mt-1.5 flex-shrink-0">
                    <div
                      className={`h-2.5 w-2.5 rounded-full ${SENTIMENT_DOT[article.sentiment]}`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold leading-tight text-text-primary">
                      {article.title}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2 text-[10px] text-text-muted">
                      <span className="font-medium">{article.source}</span>
                      <span>&middot;</span>
                      <span>{timeAgo(article.publishedAt)}</span>
                    </div>
                  </div>
                </a>
              ))}
        </div>
      )}

      {/* Macro Tab */}
      {tab === 'macro' && (
        <div className="mt-4">
          <div className="grid grid-cols-2 gap-3">
            {MACRO_CARDS.map((card) => (
              <div
                key={card.label}
                className="flex flex-col gap-1 rounded-xl border border-border-line bg-surface-card p-3"
              >
                <p className="text-[10px] font-medium uppercase tracking-wide text-text-muted">
                  {card.label}
                </p>
                <p className="font-mono-price text-lg font-bold text-text-primary">
                  {card.value}
                </p>
                <p
                  className={`text-[11px] font-semibold ${
                    card.sentiment === 'positive'
                      ? 'text-bullish'
                      : card.sentiment === 'negative'
                        ? 'text-bearish'
                        : 'text-neutral'
                  }`}
                >
                  {card.change}
                </p>
              </div>
            ))}
          </div>

          <h3 className="mt-6 mb-3 text-sm font-semibold text-text-secondary">
            Berita Makro
          </h3>
          <div className="flex flex-col gap-2">
            {articles
              .slice(0, 5)
              .map((article) => (
                <a
                  key={article.id}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex gap-3 rounded-xl border border-border-line bg-surface-card p-3 transition-colors active:bg-bg-secondary"
                >
                  <div className="mt-1.5 flex-shrink-0">
                    <div
                      className={`h-2.5 w-2.5 rounded-full ${SENTIMENT_DOT[article.sentiment]}`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold leading-tight text-text-primary">
                      {article.title}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2 text-[10px] text-text-muted">
                      <span className="font-medium">{article.source}</span>
                      <span>&middot;</span>
                      <span>{timeAgo(article.publishedAt)}</span>
                    </div>
                  </div>
                </a>
              ))}
          </div>
        </div>
      )}

      {/* Event Tab */}
      {tab === 'event' && (
        <div className="mt-4">
          {/* Category filter */}
          <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {(['Semua', 'Macro', 'Network', 'Market', 'Community', 'Regulasi'] as EventCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setEventFilter(cat)}
                className={`flex-shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                  eventFilter === cat
                    ? 'bg-accent text-bg-primary'
                    : 'border border-border-line bg-surface-card text-text-muted hover:text-text-secondary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            {MOCK_EVENTS.filter(
              (e) => eventFilter === 'Semua' || e.category === eventFilter,
            ).map((evt) => {
              const eventDate = new Date(evt.date);
              const dayStr = eventDate.toLocaleDateString('id-ID', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              });
              const countdown = getCountdown(evt.date);
              const isPast = countdown === 'Selesai';
              const isToday = countdown === 'Hari ini!';

              return (
                <div
                  key={evt.id}
                  className={`flex items-center gap-3 rounded-xl border p-3 transition-opacity ${
                    isPast
                      ? 'border-border-line bg-surface-card opacity-50'
                      : isToday
                        ? 'border-accent/40 bg-accent/5'
                        : 'border-border-line bg-surface-card'
                  }`}
                >
                  <div
                    className={`flex h-11 w-11 flex-shrink-0 flex-col items-center justify-center rounded-xl ${
                      isToday ? 'bg-accent/20' : 'bg-accent/10'
                    }`}
                  >
                    <Calendar size={12} className="text-accent" />
                    <span className="mt-0.5 text-[11px] font-bold text-accent">
                      {eventDate.getDate()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[13px] font-semibold ${isPast ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                      {evt.title}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-text-muted">{dayStr}</span>
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[9px] font-semibold ${IMPACT_COLORS[evt.impact]}`}
                      >
                        {evt.impact.toUpperCase()}
                      </span>
                      <span className="rounded-md border border-border-line px-1.5 py-0.5 text-[9px] text-text-muted">
                        {evt.category}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-[10px] font-bold ${
                        isToday
                          ? 'text-accent'
                          : isPast
                            ? 'text-text-muted'
                            : 'text-text-secondary'
                      }`}
                    >
                      {countdown}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating AI Button */}
      <button className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full bg-accent px-4 py-3 font-semibold text-bg-primary shadow-lg shadow-accent/20 transition-transform active:scale-95 md:bottom-6">
        <Sparkles size={16} />
        <span className="text-xs font-bold">Analisa AI Pasar</span>
      </button>
    </div>
  );
}
