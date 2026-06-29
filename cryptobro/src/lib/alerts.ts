'use client';

import { create } from 'zustand';

export interface PriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  direction: 'above' | 'below';
  createdAt: number;
  triggered: boolean;
  active: boolean;
}

interface AlertStore {
  alerts: PriceAlert[];
  addAlert: (alert: Omit<PriceAlert, 'id' | 'createdAt' | 'triggered' | 'active'>) => void;
  removeAlert: (id: string) => void;
  toggleAlert: (id: string) => void;
  markTriggered: (id: string) => void;
  getActiveAlerts: () => PriceAlert[];
  getAlertsBySymbol: (symbol: string) => PriceAlert[];
  clearTriggered: () => void;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function loadAlerts(): PriceAlert[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('cb_alerts');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveAlerts(alerts: PriceAlert[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('cb_alerts', JSON.stringify(alerts));
  } catch {
    /* ignore */
  }
}

export const useAlertStore = create<AlertStore>((set, get) => ({
  alerts: loadAlerts(),

  addAlert: (data) => {
    const newAlert: PriceAlert = {
      ...data,
      id: generateId(),
      createdAt: Date.now(),
      triggered: false,
      active: true,
    };
    const updated = [...get().alerts, newAlert];
    saveAlerts(updated);
    set({ alerts: updated });
  },

  removeAlert: (id) => {
    const updated = get().alerts.filter((a) => a.id !== id);
    saveAlerts(updated);
    set({ alerts: updated });
  },

  toggleAlert: (id) => {
    const updated = get().alerts.map((a) =>
      a.id === id ? { ...a, active: !a.active } : a
    );
    saveAlerts(updated);
    set({ alerts: updated });
  },

  markTriggered: (id) => {
    const updated = get().alerts.map((a) =>
      a.id === id ? { ...a, triggered: true, active: false } : a
    );
    saveAlerts(updated);
    set({ alerts: updated });
  },

  getActiveAlerts: () => {
    return get().alerts.filter((a) => a.active && !a.triggered);
  },

  getAlertsBySymbol: (symbol) => {
    return get().alerts.filter((a) => a.symbol === symbol);
  },

  clearTriggered: () => {
    const updated = get().alerts.filter((a) => !a.triggered);
    saveAlerts(updated);
    set({ alerts: updated });
  },
}));
