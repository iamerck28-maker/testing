import type { ScannerConfig } from './types';

export const SCANNERS: ScannerConfig[] = [
  { id: 'radar', name: 'Radar', description: 'Skor peluang tertinggi', icon: 'Crosshair', category: 'basic' },
  { id: 'candle', name: 'Candle Pattern', description: 'Pola candlestick terkini', icon: 'CandlestickChart', category: 'basic' },
  { id: 'chart', name: 'Chart Pattern', description: 'Triangle, breakout, double top', icon: 'Activity', category: 'basic' },
  { id: 'volume', name: 'Volume', description: 'Lonjakan volume abnormal', icon: 'BarChart3', category: 'basic' },
  { id: 'whale', name: 'Whale Flow', description: 'Pergerakan wallet besar', icon: 'Waves', category: 'advanced' },
  { id: 'accumulation', name: 'Akumulasi', description: 'Fase pengumpulan diam-diam', icon: 'Sparkles', category: 'advanced' },
  { id: 'prepump', name: 'Pre-Pump', description: 'Sinyal sebelum breakout', icon: 'TrendingUp', category: 'advanced' },
  { id: 'multitf', name: 'Multi-TF', description: 'Konfirmasi lintas timeframe', icon: 'Layers', category: 'advanced' },
  { id: 'divergence', name: 'Divergence', description: 'RSI divergence bullish/bearish', icon: 'GitBranch', category: 'advanced' },
  { id: 'confluence', name: 'Confluence', description: 'Coin muncul di 2+ scanner', icon: 'Merge', category: 'advanced' },
];

export const MODE_CONFIG = {
  scalping: { label: 'Scalping', interval: '5m', description: 'Trade cepat 5-30 menit' },
  intraday: { label: 'Intraday', interval: '1h', description: 'Trade dalam hari, 1-4 jam' },
  swing: { label: 'Swing', interval: '4h', description: 'Trade 1-7 hari' },
} as const;

export const COINGECKO_API = 'https://api.coingecko.com/api/v3';

export const TOP_COINS = [
  'bitcoin', 'ethereum', 'binancecoin', 'solana', 'ripple',
  'cardano', 'dogecoin', 'polkadot', 'avalanche-2', 'chainlink',
  'polygon', 'uniswap', 'litecoin', 'near', 'stellar',
  'aptos', 'sui', 'arbitrum', 'optimism', 'injective-protocol',
  'render-token', 'filecoin', 'hedera-hashgraph', 'cosmos', 'algorand',
  'fantom', 'aave', 'the-graph', 'maker', 'axie-infinity',
];

export const SCORE_COLORS = {
  low: '#f6465d',
  medium: '#f5a524',
  high: '#0ecb81',
  veryHigh: '#b6ff00',
} as const;

export function getScoreColor(score: number): string {
  if (score >= 80) return SCORE_COLORS.veryHigh;
  if (score >= 60) return SCORE_COLORS.high;
  if (score >= 40) return SCORE_COLORS.medium;
  return SCORE_COLORS.low;
}

export function formatPrice(price: number): string {
  if (price >= 1000) return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  if (price >= 0.01) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(6)}`;
}

export function formatVolume(vol: number): string {
  if (vol >= 1e9) return `$${(vol / 1e9).toFixed(1)}B`;
  if (vol >= 1e6) return `$${(vol / 1e6).toFixed(1)}M`;
  if (vol >= 1e3) return `$${(vol / 1e3).toFixed(1)}K`;
  return `$${vol.toFixed(0)}`;
}

export function formatMarketCap(mc: number): string {
  if (mc >= 1e12) return `$${(mc / 1e12).toFixed(2)}T`;
  if (mc >= 1e9) return `$${(mc / 1e9).toFixed(2)}B`;
  if (mc >= 1e6) return `$${(mc / 1e6).toFixed(2)}M`;
  return `$${mc.toFixed(0)}`;
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}j lalu`;
  const days = Math.floor(hours / 24);
  return `${days}h lalu`;
}
