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
  const { getActiveAlerts, markTriggered } = useAlertStore();
  const { coins } = useMarketStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const getActiveAlertsRef = useRef(getActiveAlerts);
  const markTriggeredRef = useRef(markTriggered);
  const coinsRef = useRef(coins);

  useEffect(() => { getActiveAlertsRef.current = getActiveAlerts; }, [getActiveAlerts]);
  useEffect(() => { markTriggeredRef.current = markTriggered; }, [markTriggered]);
  useEffect(() => { coinsRef.current = coins; }, [coins]);

  useEffect(() => {
    const checkAlerts = () => {
      const active = getActiveAlertsRef.current();
      const currentCoins = coinsRef.current;
      if (active.length === 0 || currentCoins.length === 0) return;

      for (const alert of active) {
        const coin = currentCoins.find((c) => c.symbol === alert.symbol);
        if (!coin) continue;

        const shouldTrigger =
          (alert.direction === 'above' && coin.price >= alert.targetPrice) ||
          (alert.direction === 'below' && coin.price <= alert.targetPrice);

        if (shouldTrigger) {
          markTriggeredRef.current(alert.id);

          if (typeof Notification !== 'undefined') {
            const body = `\u{1F514} ${alert.symbol} telah mencapai $${coin.price.toLocaleString()}! Target: $${alert.targetPrice.toLocaleString()} (${alert.direction === 'above' ? 'Di atas' : 'Di bawah'})`;
            const opts = { body, icon: coin.image };
            if (Notification.permission === 'granted') {
              new Notification(`Price Alert - ${alert.symbol}`, opts);
            } else if (Notification.permission !== 'denied') {
              Notification.requestPermission().then((perm) => {
                if (perm === 'granted') new Notification(`Price Alert - ${alert.symbol}`, opts);
              });
            }
          }

          playBeep();
        }
      }
    };

    checkAlerts();
    intervalRef.current = setInterval(checkAlerts, 30000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return null;
}
