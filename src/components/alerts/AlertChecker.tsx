'use client';

import { useEffect, useRef } from 'react';
import { useAlertStore } from '@/lib/alerts';
import { useIndicatorAlertStore } from '@/lib/indicator-alerts';
import { useMarketStore } from '@/lib/store';
import { fetchCoinOHLCV } from '@/lib/api';
import { computeRSI } from '@/lib/backtest-engine';

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

function sendNotification(title: string, body: string, icon?: string) {
  if (typeof Notification === 'undefined') return;
  const opts = { body, icon };
  if (Notification.permission === 'granted') {
    new Notification(title, opts);
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((perm) => {
      if (perm === 'granted') new Notification(title, opts);
    });
  }
}

export default function AlertChecker() {
  const { getActiveAlerts, markTriggered } = useAlertStore();
  const { getActiveAlerts: getActiveIndicatorAlerts, markTriggered: markIndicatorTriggered } =
    useIndicatorAlertStore();
  const { coins } = useMarketStore();

  const priceAlertsRef = useRef(getActiveAlerts);
  const markPriceRef = useRef(markTriggered);
  const indicatorAlertsRef = useRef(getActiveIndicatorAlerts);
  const markIndicatorRef = useRef(markIndicatorTriggered);
  const coinsRef = useRef(coins);
  const priceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const indicatorIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { priceAlertsRef.current = getActiveAlerts; }, [getActiveAlerts]);
  useEffect(() => { markPriceRef.current = markTriggered; }, [markTriggered]);
  useEffect(() => { indicatorAlertsRef.current = getActiveIndicatorAlerts; }, [getActiveIndicatorAlerts]);
  useEffect(() => { markIndicatorRef.current = markIndicatorTriggered; }, [markIndicatorTriggered]);
  useEffect(() => { coinsRef.current = coins; }, [coins]);

  useEffect(() => {
    const checkPriceAlerts = () => {
      const active = priceAlertsRef.current();
      const currentCoins = coinsRef.current;
      if (active.length === 0 || currentCoins.length === 0) return;

      for (const alert of active) {
        const coin = currentCoins.find((c) => c.symbol === alert.symbol);
        if (!coin) continue;
        const hit =
          (alert.direction === 'above' && coin.price >= alert.targetPrice) ||
          (alert.direction === 'below' && coin.price <= alert.targetPrice);
        if (hit) {
          markPriceRef.current(alert.id);
          sendNotification(
            `Price Alert — ${alert.symbol}`,
            `\u{1F514} ${alert.symbol} mencapai $${coin.price.toLocaleString()}! Target: $${alert.targetPrice.toLocaleString()} (${alert.direction === 'above' ? 'Di atas' : 'Di bawah'})`,
            coin.image,
          );
          playBeep();
        }
      }
    };

    const checkIndicatorAlerts = async () => {
      const active = indicatorAlertsRef.current();
      if (active.length === 0) return;

      const byId = new Map<string, typeof active>();
      for (const a of active) {
        const list = byId.get(a.coinId) ?? [];
        list.push(a);
        byId.set(a.coinId, list);
      }

      for (const [coinId, alerts] of byId) {
        try {
          const ohlcv = await fetchCoinOHLCV(coinId, 7);
          if (ohlcv.length < 15) continue;
          const closes = ohlcv.map((c) => c.close);
          const rsiValues = computeRSI(closes, 14);
          const currentRSI = rsiValues[rsiValues.length - 1];
          if (currentRSI == null) continue;

          for (const alert of alerts) {
            const hit =
              (alert.direction === 'above' && currentRSI >= alert.threshold) ||
              (alert.direction === 'below' && currentRSI <= alert.threshold);
            if (hit) {
              markIndicatorRef.current(alert.id);
              sendNotification(
                `RSI Alert — ${alert.symbol}`,
                `\u{1F4CA} ${alert.symbol} RSI sekarang ${currentRSI.toFixed(1)}, ${alert.direction === 'above' ? 'di atas' : 'di bawah'} ${alert.threshold}`,
              );
              playBeep();
            }
          }
        } catch {
          /* ignore fetch errors for individual coins */
        }
      }
    };

    checkPriceAlerts();
    checkIndicatorAlerts();

    priceIntervalRef.current = setInterval(checkPriceAlerts, 30_000);
    indicatorIntervalRef.current = setInterval(checkIndicatorAlerts, 5 * 60_000);

    return () => {
      if (priceIntervalRef.current) clearInterval(priceIntervalRef.current);
      if (indicatorIntervalRef.current) clearInterval(indicatorIntervalRef.current);
    };
  }, []);

  return null;
}
