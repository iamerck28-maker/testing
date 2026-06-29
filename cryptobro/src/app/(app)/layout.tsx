'use client';

import BottomNav from '@/components/layout/BottomNav';
import TopNav from '@/components/layout/TopNav';
import Header from '@/components/layout/Header';
import CoinDetailSheet from '@/components/coin/CoinDetailSheet';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopNav />
      <Header showMarketType showMode />
      <main className="mx-auto w-full max-w-6xl flex-1 pb-20 md:pb-4">
        {children}
      </main>
      <BottomNav />
      <CoinDetailSheet />
    </>
  );
}
