import type { CoinData, OHLCV, MarketPulseData, NewsArticle } from './types';
import { COINGECKO_API } from './constants';

const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

async function cachedFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }
  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}

export async function fetchMarketData(page = 1, perPage = 50): Promise<CoinData[]> {
  return cachedFetch(`market_${page}_${perPage}`, async () => {
    const res = await fetch(
      `${COINGECKO_API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=false&price_change_percentage=24h`
    );
    if (!res.ok) throw new Error('Failed to fetch market data');
    const data = await res.json();
    return data.map((coin: Record<string, unknown>) => ({
      id: coin.id as string,
      symbol: (coin.symbol as string).toUpperCase(),
      name: coin.name as string,
      price: (coin.current_price as number) ?? 0,
      change24h: (coin.price_change_percentage_24h as number) ?? 0,
      volume24h: (coin.total_volume as number) ?? 0,
      marketCap: (coin.market_cap as number) ?? 0,
      rank: (coin.market_cap_rank as number) ?? 0,
      image: coin.image as string,
      high24h: (coin.high_24h as number) ?? 0,
      low24h: (coin.low_24h as number) ?? 0,
    }));
  });
}

export async function fetchCoinOHLCV(coinId: string, days = 7): Promise<OHLCV[]> {
  return cachedFetch(`ohlcv_${coinId}_${days}`, async () => {
    const res = await fetch(
      `${COINGECKO_API}/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`
    );
    if (!res.ok) throw new Error('Failed to fetch OHLCV');
    const data: number[][] = await res.json();
    return data.map((d) => ({
      time: d[0] / 1000,
      open: d[1],
      high: d[2],
      low: d[3],
      close: d[4],
      volume: 0,
    }));
  });
}

export async function fetchMarketPulse(): Promise<MarketPulseData> {
  return cachedFetch('market_pulse', async () => {
    const [fgRes, globalRes] = await Promise.all([
      fetch('https://api.alternative.me/fng/?limit=1').then(r => r.json()).catch(() => null),
      fetch(`${COINGECKO_API}/global`).then(r => r.json()).catch(() => null),
    ]);

    return {
      fearGreed: {
        value: fgRes?.data?.[0]?.value ? parseInt(fgRes.data[0].value) : 50,
        label: fgRes?.data?.[0]?.value_classification || 'Neutral',
      },
      btcDominance: globalRes?.data?.market_cap_percentage?.btc || 0,
      fundingRate: 0.01,
      totalVolume: globalRes?.data?.total_volume?.usd || 0,
    };
  });
}

export async function fetchNews(): Promise<NewsArticle[]> {
  return cachedFetch('news', async () => {
    try {
      const res = await fetch(
        'https://min-api.cryptocompare.com/data/v2/news/?lang=EN&sortOrder=popular'
      );
      if (!res.ok) return generateMockNews();
      const data = await res.json();
      return (data.Data || []).slice(0, 20).map((item: Record<string, unknown>, i: number) => ({
        id: String(item.id || i),
        title: item.title as string,
        source: item.source as string,
        url: item.url as string,
        publishedAt: new Date((item.published_on as number) * 1000).toISOString(),
        sentiment: (['positive', 'negative', 'neutral'] as const)[i % 3],
        category: 'crypto' as const,
        description: item.body ? (item.body as string).slice(0, 120) + '...' : '',
      }));
    } catch {
      return generateMockNews();
    }
  });
}

function generateMockNews(): NewsArticle[] {
  const titles = [
    'Bitcoin Menembus Resistance Key di $70,000',
    'Ethereum ETF Mendapat Persetujuan SEC',
    'Solana TVL Melonjak 40% dalam Sepekan',
    'Fed Pertahankan Suku Bunga, Pasar Crypto Rally',
    'Whale Alert: 10,000 BTC Dipindahkan ke Exchange',
  ];
  return titles.map((title, i) => ({
    id: String(i),
    title,
    source: ['CoinDesk', 'CoinTelegraph', 'The Block', 'Bloomberg', 'Reuters'][i],
    url: '#',
    publishedAt: new Date(Date.now() - i * 3600000).toISOString(),
    sentiment: (['positive', 'negative', 'neutral'] as const)[i % 3],
    category: 'crypto' as const,
    description: `${title} - Berita terkini seputar pasar cryptocurrency...`,
  }));
}

export function clearCache(): void {
  cache.clear();
}
