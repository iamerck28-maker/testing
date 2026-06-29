'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { useAlertStore } from '@/lib/alerts';
import { formatPrice } from '@/lib/constants';

export default function AlertBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { alerts, getActiveAlerts, removeAlert, clearTriggered } = useAlertStore();

  const activeCount = getActiveAlerts().length;
  const triggeredAlerts = alerts.filter((a) => a.triggered);
  const hasTriggered = triggeredAlerts.length > 0;

  // Group alerts by symbol
  const grouped = alerts.reduce<Record<string, typeof alerts>>((acc, alert) => {
    if (!acc[alert.symbol]) acc[alert.symbol] = [];
    acc[alert.symbol].push(alert);
    return acc;
  }, {});

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center rounded-lg p-1.5 text-text-muted transition-colors hover:text-text-primary"
      >
        <Bell size={18} />
        {activeCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-bg-primary">
            {activeCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-xl border border-border-line bg-bg-primary shadow-lg">
          <div className="flex items-center justify-between border-b border-border-line px-3 py-2.5">
            <p className="text-xs font-semibold text-text-primary">Price Alerts</p>
            {hasTriggered && (
              <button
                onClick={clearTriggered}
                className="flex items-center gap-1 text-[10px] text-text-muted transition-colors hover:text-bearish"
              >
                <Trash2 size={10} />
                Hapus triggered
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell size={24} className="mx-auto mb-2 text-text-muted/40" />
                <p className="text-xs text-text-muted">
                  Belum ada alert. Set alert dari halaman coin.
                </p>
              </div>
            ) : (
              Object.entries(grouped).map(([symbol, symbolAlerts]) => (
                <div key={symbol}>
                  <div className="bg-surface-card px-3 py-1.5">
                    <p className="text-[10px] font-bold text-text-secondary">{symbol}</p>
                  </div>
                  {symbolAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between border-b border-border-line/50 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        {alert.triggered ? (
                          <Check size={12} className="text-bullish" />
                        ) : alert.direction === 'above' ? (
                          <ArrowUp size={12} className="text-bullish" />
                        ) : (
                          <ArrowDown size={12} className="text-bearish" />
                        )}
                        <span
                          className={`font-mono-price text-[11px] font-semibold ${
                            alert.triggered ? 'text-text-muted line-through' : 'text-text-primary'
                          }`}
                        >
                          {formatPrice(alert.targetPrice)}
                        </span>
                        {alert.triggered && (
                          <Check size={10} className="text-bullish" />
                        )}
                        {!alert.active && !alert.triggered && (
                          <span className="text-[9px] text-text-muted">paused</span>
                        )}
                      </div>
                      <button
                        onClick={() => removeAlert(alert.id)}
                        className="text-text-muted transition-colors hover:text-bearish"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
