'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export interface TickerData {
  price: number;
  change24h: number;
}

interface BinanceMiniTicker {
  e: string; // event type
  s: string; // symbol e.g. "BTCUSDT"
  c: string; // close price
  o: string; // open price
  h: string; // high
  l: string; // low
  v: string; // base volume
  q: string; // quote volume
}

interface StreamMessage {
  stream: string;
  data: BinanceMiniTicker;
}

const MAX_RETRIES = 5;
const BASE_DELAY = 1000;
const THROTTLE_MS = 1000;

export function useBinanceWebSocket(symbols: string[]): Map<string, TickerData> {
  const [tickerMap, setTickerMap] = useState<Map<string, TickerData>>(new Map());
  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const pendingUpdatesRef = useRef<Map<string, TickerData>>(new Map());
  const throttleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushUpdates = useCallback(() => {
    if (!mountedRef.current) return;
    const pending = pendingUpdatesRef.current;
    if (pending.size === 0) return;

    setTickerMap((prev) => {
      const next = new Map(prev);
      for (const [sym, data] of pending) {
        next.set(sym, data);
      }
      return next;
    });
    pendingUpdatesRef.current = new Map();
  }, []);

  const scheduleFlush = useCallback(() => {
    if (throttleTimerRef.current !== null) return;
    throttleTimerRef.current = setTimeout(() => {
      throttleTimerRef.current = null;
      flushUpdates();
    }, THROTTLE_MS);
  }, [flushUpdates]);

  useEffect(() => {
    mountedRef.current = true;

    if (symbols.length === 0) return;

    const binanceSymbols = symbols.map((s) => `${s.toLowerCase()}usdt`);
    const streams = binanceSymbols.map((s) => `${s}@miniTicker`).join('/');
    const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;

    function connect() {
      if (!mountedRef.current) return;

      try {
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          retriesRef.current = 0;
        };

        ws.onmessage = (event) => {
          if (!mountedRef.current) return;
          try {
            const msg: StreamMessage = JSON.parse(event.data);
            const ticker = msg.data;
            if (!ticker || !ticker.s) return;

            const symbol = ticker.s.replace(/USDT$/i, '').toUpperCase();
            const closePrice = parseFloat(ticker.c);
            const openPrice = parseFloat(ticker.o);

            if (isNaN(closePrice) || isNaN(openPrice) || openPrice === 0) return;

            const change24h = ((closePrice - openPrice) / openPrice) * 100;

            pendingUpdatesRef.current.set(symbol, {
              price: closePrice,
              change24h,
            });

            scheduleFlush();
          } catch {
            // Ignore malformed messages
          }
        };

        ws.onclose = () => {
          if (!mountedRef.current) return;
          if (retriesRef.current < MAX_RETRIES) {
            const delay = BASE_DELAY * Math.pow(2, retriesRef.current);
            retriesRef.current += 1;
            reconnectTimerRef.current = setTimeout(connect, delay);
          }
        };

        ws.onerror = () => {
          // Error will trigger onclose, which handles reconnection
          ws.close();
        };
      } catch {
        // Connection failed, try reconnect
        if (mountedRef.current && retriesRef.current < MAX_RETRIES) {
          const delay = BASE_DELAY * Math.pow(2, retriesRef.current);
          retriesRef.current += 1;
          reconnectTimerRef.current = setTimeout(connect, delay);
        }
      }
    }

    connect();

    return () => {
      mountedRef.current = false;
      if (throttleTimerRef.current !== null) {
        clearTimeout(throttleTimerRef.current);
        throttleTimerRef.current = null;
      }
      if (reconnectTimerRef.current !== null) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [symbols.join(','), scheduleFlush]);

  return tickerMap;
}
