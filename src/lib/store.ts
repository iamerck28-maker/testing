'use client';

import { create } from 'zustand';
import type { TradingMode, MarketType, CoinData, ScannerResult, MarketPulseData } from './types';

interface AppStore {
  mode: TradingMode;
  marketType: MarketType;
  watchlist: string[];
  recentlyViewed: string[];
  scannerResults: Record<string, ScannerResult>;
  selectedCoin: string | null;
  coinDetailOpen: boolean;

  setMode: (mode: TradingMode) => void;
  setMarketType: (type: MarketType) => void;
  addToWatchlist: (symbol: string) => void;
  removeFromWatchlist: (symbol: string) => void;
  isInWatchlist: (symbol: string) => boolean;
  addRecentlyViewed: (symbol: string) => void;
  setScannerResult: (scannerId: string, result: Partial<ScannerResult>) => void;
  openCoinDetail: (symbol: string) => void;
  closeCoinDetail: () => void;
}

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* ignore */ }
}

export const useAppStore = create<AppStore>((set, get) => ({
  mode: loadFromStorage<TradingMode>('cb_mode', 'intraday'),
  marketType: loadFromStorage<MarketType>('cb_market', 'spot'),
  watchlist: loadFromStorage<string[]>('cb_watchlist', []),
  recentlyViewed: loadFromStorage<string[]>('cb_recent', []),
  scannerResults: {},
  selectedCoin: null,
  coinDetailOpen: false,

  setMode: (mode) => {
    saveToStorage('cb_mode', mode);
    set({ mode });
  },
  setMarketType: (type) => {
    saveToStorage('cb_market', type);
    set({ marketType: type });
  },
  addToWatchlist: (symbol) => {
    const list = [...get().watchlist];
    if (!list.includes(symbol)) {
      list.push(symbol);
      saveToStorage('cb_watchlist', list);
      set({ watchlist: list });
    }
  },
  removeFromWatchlist: (symbol) => {
    const list = get().watchlist.filter(s => s !== symbol);
    saveToStorage('cb_watchlist', list);
    set({ watchlist: list });
  },
  isInWatchlist: (symbol) => get().watchlist.includes(symbol),
  addRecentlyViewed: (symbol) => {
    const list = [symbol, ...get().recentlyViewed.filter(s => s !== symbol)].slice(0, 3);
    saveToStorage('cb_recent', list);
    set({ recentlyViewed: list });
  },
  setScannerResult: (scannerId, result) => {
    set((state) => ({
      scannerResults: {
        ...state.scannerResults,
        [scannerId]: { ...state.scannerResults[scannerId], ...result } as ScannerResult,
      },
    }));
  },
  openCoinDetail: (symbol) => {
    get().addRecentlyViewed(symbol);
    set({ selectedCoin: symbol, coinDetailOpen: true });
  },
  closeCoinDetail: () => set({ selectedCoin: null, coinDetailOpen: false }),
}));

interface MarketStore {
  coins: CoinData[];
  loading: boolean;
  error: string | null;
  marketPulse: MarketPulseData | null;
  setCoins: (coins: CoinData[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setMarketPulse: (data: MarketPulseData) => void;
}

export const useMarketStore = create<MarketStore>((set) => ({
  coins: [],
  loading: false,
  error: null,
  marketPulse: null,
  setCoins: (coins) => set({ coins, loading: false, error: null }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
  setMarketPulse: (data) => set({ marketPulse: data }),
}));
