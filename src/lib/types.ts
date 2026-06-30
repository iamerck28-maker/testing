export interface CoinData {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  rank: number;
  image: string;
  high24h: number;
  low24h: number;
}

export interface FundingRateEntry {
  symbol: string;
  markPrice: number;
  fundingRate: number;
  nextFundingTime: number;
}

export interface BacktestTrade {
  entryDate: number;
  exitDate: number;
  entryPrice: number;
  exitPrice: number;
  returnPct: number;
}

export interface BacktestResult {
  strategy: string;
  symbol: string;
  tradeCount: number;
  winRate: number;
  totalReturn: number;
  maxDrawdown: number;
  trades: BacktestTrade[];
  startDate: number;
  endDate: number;
}

export interface ScannerPick extends CoinData {
  score: number;
  signals: string[];
  meta: string;
  direction: 'bullish' | 'bearish' | 'neutral';
}

export interface ScannerConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'basic' | 'advanced';
}

export interface ScannerResult {
  scannerId: string;
  picks: ScannerPick[];
  lastUpdated: number;
  loading: boolean;
  error: string | null;
}

export interface IndicatorData {
  rsi: number;
  macd: { value: number; signal: number; histogram: number };
  ma: { ma20: number; ma50: number; ma200: number };
  stochRsi: { k: number; d: number };
  bb: { upper: number; middle: number; lower: number };
  volume: { current: number; average: number; ratio: number };
}

export interface CoinDetail extends CoinData {
  indicators: IndicatorData;
  support: number[];
  resistance: number[];
  tp1?: number;
  tp2?: number;
  stopLoss?: number;
  scannerCheck: string[];
  fundingRate?: number;
  openInterest?: number;
  ohlcv: OHLCV[];
}

export interface OHLCV {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface NewsArticle {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  category: 'crypto' | 'macro' | 'event';
  description?: string;
}

export interface MacroData {
  fearGreedIndex: number;
  fearGreedLabel: string;
  btcDominance: number;
  totalVolume: number;
  totalMarketCap: number;
}

export interface MarketPulseData {
  fearGreed: { value: number; label: string };
  btcDominance: number;
  fundingRate: number;
  totalVolume: number;
}

export type TradingMode = 'scalping' | 'intraday' | 'swing';
export type MarketType = 'spot' | 'futures';

export interface ValidationStat {
  scanner: string;
  total: number;
  wins: number;
  losses: number;
  pending: number;
  winRate: number;
}
