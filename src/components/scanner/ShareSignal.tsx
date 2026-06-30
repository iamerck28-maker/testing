'use client';

import { useEffect, useRef, useState } from 'react';
import { Share2, Copy, Check } from 'lucide-react';
import type { ScannerPick } from '@/lib/types';
import { formatPrice } from '@/lib/constants';

interface ShareSignalProps {
  pick: ScannerPick;
  scannerName: string;
}

function buildMessage(pick: ScannerPick, scannerName: string): string {
  const signalLine = pick.signals.join(', ');
  const change = `${pick.change24h >= 0 ? '+' : ''}${pick.change24h.toFixed(2)}`;
  return (
    `🚀 *${pick.symbol} - ${scannerName}*\n\n` +
    `💰 Harga: ${formatPrice(pick.price)}\n` +
    `📈 24h: ${change}%\n` +
    `⭐ Score: ${pick.score}/100\n\n` +
    `Sinyal: ${signalLine}\n` +
    `${pick.meta}\n\n` +
    `#CryptoBro #Crypto #${pick.symbol}`
  );
}

export default function ShareSignal({ pick, scannerName }: ShareSignalProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const message = buildMessage(pick, scannerName);
  const encodedMessage = encodeURIComponent(message);
  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://cryptobro.app';

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank', 'noopener,noreferrer');
    setOpen(false);
  };

  const handleTelegram = () => {
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(appUrl)}&text=${encodedMessage}`,
      '_blank',
      'noopener,noreferrer'
    );
    setOpen(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silently fail
    }
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="flex items-center justify-center rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-card hover:text-text-primary active:scale-95"
        aria-label="Bagikan sinyal"
      >
        <Share2 size={14} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-8 z-50 min-w-[160px] overflow-hidden rounded-xl border border-border-line bg-surface-card shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {/* WhatsApp */}
          <button
            onClick={handleWhatsApp}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-text-primary transition-colors hover:bg-bg-primary"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#25d366] text-[10px] font-bold text-white">
              W
            </span>
            WhatsApp
          </button>

          {/* Telegram */}
          <button
            onClick={handleTelegram}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-text-primary transition-colors hover:bg-bg-primary"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2ca5e0] text-[10px] font-bold text-white">
              T
            </span>
            Telegram
          </button>

          {/* Copy */}
          <button
            onClick={handleCopy}
            className="flex w-full items-center gap-2.5 border-t border-border-line px-3 py-2.5 text-left text-sm text-text-primary transition-colors hover:bg-bg-primary"
          >
            {copied ? (
              <Check size={16} className="text-bullish" />
            ) : (
              <Copy size={16} className="text-text-muted" />
            )}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}
    </div>
  );
}
