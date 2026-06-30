'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'cryptobro-install-dismissed';

function isIosSafari(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  const isIos = /iphone|ipad|ipod/i.test(ua);
  const isSafari = /safari/i.test(ua) && !/chrome|crios|fxios/i.test(ua);
  return isIos && isSafari;
}

function isInStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator &&
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if (isInStandaloneMode()) return;
    if (localStorage.getItem(DISMISSED_KEY)) return;

    if (isIosSafari()) {
      setShowIosHint(true);
      setShowBanner(true);

      const timer = setTimeout(() => {
        setShowBanner(false);
      }, 10000);
      return () => clearTimeout(timer);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  useEffect(() => {
    if (!showBanner || showIosHint) return;

    const timer = setTimeout(() => {
      setShowBanner(false);
    }, 10000);

    return () => clearTimeout(timer);
  }, [showBanner, showIosHint]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-md">
      <div className="flex items-center gap-3 rounded-2xl border border-border-line bg-surface-card px-4 py-3 shadow-lg">
        <span className="flex-1 text-sm font-medium text-text-primary">
          {showIosHint
            ? 'Tap ⬆️ lalu \'Add to Home Screen\''
            : '📱 Install CryptoBro di Home Screen kamu!'}
        </span>
        <div className="flex items-center gap-2">
          {!showIosHint && deferredPrompt && (
            <button
              onClick={handleInstall}
              className="rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-bg-primary transition-transform active:scale-95"
            >
              Install
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="flex items-center gap-1 rounded-lg border border-border-line px-2 py-1.5 text-xs font-medium text-text-muted transition-colors hover:text-text-primary"
          >
            {showIosHint ? <X size={12} /> : 'Nanti'}
          </button>
        </div>
      </div>
    </div>
  );
}
