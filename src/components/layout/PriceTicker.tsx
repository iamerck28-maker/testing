'use client';

import { useMemo, useRef, useEffect, useState } from 'react';
import { useBinanceWebSocket, type TickerData } from '@/lib/websocket';

const TICKER_SYMBOLS = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'];

function formatTickerPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(2);
  return price.toFixed(4);
}

interface TickerItemProps {
  symbol: string;
  data: TickerData | undefined;
}

function TickerItem({ symbol, data }: TickerItemProps) {
  const prevPriceRef = useRef<number | null>(null);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (!data) return;
    const prev = prevPriceRef.current;
    if (prev !== null && prev !== data.price) {
      setFlash(data.price > prev ? 'up' : 'down');
      const timer = setTimeout(() => setFlash(null), 500);
      return () => clearTimeout(timer);
    }
    prevPriceRef.current = data.price;
  }, [data?.price]);

  // Update ref outside the effect to always track latest
  useEffect(() => {
    if (data) prevPriceRef.current = data.price;
  }, [data?.price]);

  const isPositive = data ? data.change24h >= 0 : true;

  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap px-3"
      style={{ fontSize: '10px' }}
    >
      <span className="font-semibold text-text-primary">{symbol}</span>
      <span
        className="font-mono transition-colors duration-300"
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          color: flash === 'up' ? '#0ecb81' : flash === 'down' ? '#f6465d' : '#929aa5',
        }}
      >
        ${data ? formatTickerPrice(data.price) : '--'}
      </span>
      <span
        className="font-semibold"
        style={{
          color: isPositive ? '#0ecb81' : '#f6465d',
          fontSize: '9px',
        }}
      >
        {data ? `${isPositive ? '+' : ''}${data.change24h.toFixed(2)}%` : '--'}
      </span>
    </span>
  );
}

export default function PriceTicker() {
  const stableSymbols = useMemo(() => TICKER_SYMBOLS, []);
  const tickerMap = useBinanceWebSocket(stableSymbols);

  return (
    <div
      className="w-full overflow-hidden border-b"
      style={{
        height: '32px',
        backgroundColor: 'var(--bg-primary)',
        borderColor: 'var(--border)',
      }}
    >
      <div className="ticker-scroll flex h-full items-center">
        {/* Duplicate content for seamless loop */}
        <div className="ticker-content flex items-center">
          {TICKER_SYMBOLS.map((sym) => (
            <TickerItem key={sym} symbol={sym} data={tickerMap.get(sym)} />
          ))}
        </div>
        <div className="ticker-content flex items-center" aria-hidden>
          {TICKER_SYMBOLS.map((sym) => (
            <TickerItem key={`dup-${sym}`} symbol={sym} data={tickerMap.get(sym)} />
          ))}
        </div>
      </div>

      <style jsx>{`
        .ticker-scroll {
          display: flex;
          width: max-content;
          animation: ticker-marquee 20s linear infinite;
        }
        .ticker-content {
          flex-shrink: 0;
        }
        @keyframes ticker-marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .ticker-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
