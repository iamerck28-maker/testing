'use client';

import { create } from 'zustand';

export interface PortfolioHolding {
  id: string;
  symbol: string;
  amount: number;
  buyPrice: number;
  addedAt: number;
}

interface PortfolioStore {
  holdings: PortfolioHolding[];
  addHolding: (symbol: string, amount: number, buyPrice: number) => void;
  removeHolding: (id: string) => void;
  updateHolding: (id: string, amount: number, buyPrice: number) => void;
  getTotalValue: (prices: Record<string, number>) => number;
  getTotalPnL: (prices: Record<string, number>) => { pnl: number; pnlPct: number };
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function loadHoldings(): PortfolioHolding[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('cb_portfolio');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveHoldings(holdings: PortfolioHolding[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('cb_portfolio', JSON.stringify(holdings));
  } catch { /* ignore */ }
}

export const usePortfolioStore = create<PortfolioStore>((set, get) => ({
  holdings: loadHoldings(),

  addHolding: (symbol, amount, buyPrice) => {
    const newHolding: PortfolioHolding = {
      id: generateId(),
      symbol,
      amount,
      buyPrice,
      addedAt: Date.now(),
    };
    const holdings = [...get().holdings, newHolding];
    saveHoldings(holdings);
    set({ holdings });
  },

  removeHolding: (id) => {
    const holdings = get().holdings.filter((h) => h.id !== id);
    saveHoldings(holdings);
    set({ holdings });
  },

  updateHolding: (id, amount, buyPrice) => {
    const holdings = get().holdings.map((h) =>
      h.id === id ? { ...h, amount, buyPrice } : h
    );
    saveHoldings(holdings);
    set({ holdings });
  },

  getTotalValue: (prices) => {
    return get().holdings.reduce((sum, h) => {
      const price = prices[h.symbol];
      if (price == null) return sum;
      return sum + h.amount * price;
    }, 0);
  },

  getTotalPnL: (prices) => {
    const holdings = get().holdings;
    let totalCost = 0;
    let totalValue = 0;

    for (const h of holdings) {
      const price = prices[h.symbol];
      if (price == null) continue;
      totalCost += h.amount * h.buyPrice;
      totalValue += h.amount * price;
    }

    const pnl = totalValue - totalCost;
    const pnlPct = totalCost > 0 ? (pnl / totalCost) * 100 : 0;
    return { pnl, pnlPct };
  },
}));
