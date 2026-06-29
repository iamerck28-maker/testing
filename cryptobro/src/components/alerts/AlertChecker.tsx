'use client';

import { useEffect, useRef } from 'react';
import { useAlertStore } from '@/lib/alerts';
import { useMarketStore } from '@/lib/store';

function playBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    /* audio not available */
  }
}

export default function AlertChecker() {
  const { alerts, getActiveAlerts, markTriggered } = useAlertStore();
  const { coins } = useMarketStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const checkAlerts = () => {
      const active = getActiveAlerts();
      if (active.length === 0 || coins.length === 0) return;

      for (const alert of active) {
        const coin = coins.find((c) => c.symbol === alert.symbol);
        if (!coin) continue;

        const shouldTrigger =
          (alert.direction === 'above' && coin.price >= alert.targetPrice) ||
          (alert.direction === 'below' && coin.price <= alert.targetPrice);

        if (shouldTrigger) {
          markTriggered(alert.id);

          // Request notification permission and show notification
          if (typeof Notification !== 'undefined') {
            if (Notification.permission === 'granted') {
              new Notification(`Price Alert - ${alert.symbol}`, {
                body: `\u{1F514} ${alert.symbol} telah mencapai $${coin.price.toLocaleString()}! Target: $${alert.targetPrice.toLocaleString()} (${alert.direction === 'above' ? 'Di atas' : 'Di bawah'})`,
                icon: coin.image,
              });
            } else if (Notification.permission !== 'denied') {
              Notification.requestPermission().then((perm) => {
                if (perm === 'granted') {
                  new Notification(`Price Alert - ${alert.symbol}`, {
                    body: `\u{1F514} ${alert.symbol} telah mencapai $${coin.price.toLocaleString()}! Target: $${alert.targetPrice.toLocaleString()} (${alert.direction === 'above' ? 'Di atas' : 'Di bawah'})`,
                    icon: coin.image,
                  });
                }
              });
            }
          }

          playBeep();
        }
      }
    };

    // Check immediately
    checkAlerts();

    // Then check every 30 seconds
    intervalRef.current = setInterval(checkAlerts, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [alerts, coins, getActiveAlerts, markTriggered]);

  return null;
}
