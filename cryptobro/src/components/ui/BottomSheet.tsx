'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setDragStart(e.touches[0].clientY);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (dragStart === null) return;
      const offset = Math.max(0, e.touches[0].clientY - dragStart);
      setDragOffset(offset);
    },
    [dragStart]
  );

  const handleTouchEnd = useCallback(() => {
    if (dragOffset > 100) {
      onClose();
    }
    setDragStart(null);
    setDragOffset(0);
  }, [dragOffset, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
        onClick={onClose}
      />

      {/* Sheet - bottom sheet on mobile, centered modal on desktop */}
      <div
        ref={sheetRef}
        className="slide-up absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-hidden rounded-t-[20px] bg-bg-secondary md:bottom-auto md:left-1/2 md:top-1/2 md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[20px]"
        style={{
          transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle bar */}
        <div className="flex justify-center py-3 md:hidden">
          <div className="h-1 w-9 rounded-full bg-text-muted/40" />
        </div>

        {/* Title */}
        <div className="flex items-center justify-between border-b border-border-line px-4 pb-3 md:pt-4">
          <h2 className="text-base font-semibold text-text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="hidden text-text-muted hover:text-text-primary md:block"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4" style={{ maxHeight: 'calc(85vh - 100px)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
