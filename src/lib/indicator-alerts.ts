'use client';

import { create } from 'zustand';

export interface IndicatorAlert {
  id: string;
  symbol: string;
  coinId: string;
  indicator: 'rsi';
  threshold: number;
  direction: 'above' | 'below';
  period: number;
  createdAt: number;
  triggered: boolean;
  active: boolean;
}

interface IndicatorAlertStore {
  alerts: IndicatorAlert[];
  addAlert: (data: Omit<IndicatorAlert, 'id' | 'createdAt' | 'triggered' | 'active'>) => void;
  removeAlert: (id: string) => void;
  toggleAlert: (id: string) => void;
  markTriggered: (id: string) => void;
  getActiveAlerts: () => IndicatorAlert[];
  getAlertsBySymbol: (symbol: string) => IndicatorAlert[];
}

const STORAGE_KEY = 'cb_indicator_alerts';

function load(): IndicatorAlert[] {
  if (typeof window === 'undefined') return [];
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
}

function save(alerts: IndicatorAlert[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
  } catch { /* ignore */ }
}

export const useIndicatorAlertStore = create<IndicatorAlertStore>((set, get) => ({
  alerts: load(),

  addAlert: (data) => {
    const a: IndicatorAlert = {
      ...data,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: Date.now(),
      triggered: false,
      active: true,
    };
    const updated = [...get().alerts, a];
    save(updated);
    set({ alerts: updated });
  },

  removeAlert: (id) => {
    const updated = get().alerts.filter((a) => a.id !== id);
    save(updated);
    set({ alerts: updated });
  },

  toggleAlert: (id) => {
    const updated = get().alerts.map((a) => a.id === id ? { ...a, active: !a.active } : a);
    save(updated);
    set({ alerts: updated });
  },

  markTriggered: (id) => {
    const updated = get().alerts.map((a) => a.id === id ? { ...a, triggered: true, active: false } : a);
    save(updated);
    set({ alerts: updated });
  },

  getActiveAlerts: () => get().alerts.filter((a) => a.active && !a.triggered),

  getAlertsBySymbol: (symbol) => get().alerts.filter((a) => a.symbol === symbol),
}));
