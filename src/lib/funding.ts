import type { FundingRateEntry } from './types';

const CACHE: { data: FundingRateEntry[] | null; ts: number } = { data: null, ts: 0 };
const CACHE_TTL = 60_000; // 1 minute

export async function fetchFundingRates(): Promise<FundingRateEntry[]> {
  if (CACHE.data && Date.now() - CACHE.ts < CACHE_TTL) return CACHE.data;

  const res = await fetch('https://fapi.binance.com/fapi/v1/premiumIndex');
  if (!res.ok) throw new Error('Failed to fetch funding rates');

  const raw = (await res.json()) as Array<{
    symbol: string;
    markPrice: string;
    lastFundingRate: string;
    nextFundingTime: number;
  }>;

  const data: FundingRateEntry[] = raw
    .filter((r) => r.symbol.endsWith('USDT') && r.lastFundingRate !== '')
    .map((r) => ({
      symbol: r.symbol.replace('USDT', ''),
      markPrice: parseFloat(r.markPrice),
      fundingRate: parseFloat(r.lastFundingRate) * 100, // convert to %
      nextFundingTime: r.nextFundingTime,
    }))
    .sort((a, b) => Math.abs(b.fundingRate) - Math.abs(a.fundingRate));

  CACHE.data = data;
  CACHE.ts = Date.now();
  return data;
}
