import type { CoinData, ScannerPick } from './types';

function rng(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function computeRSI(coin: CoinData): number {
  const base = 50 + coin.change24h * 2;
  return Math.max(10, Math.min(90, base + rng(coin.price * 7) * 15 - 7));
}

function computeVolumeRatio(coin: CoinData): number {
  return 0.5 + rng(coin.volume24h) * 3;
}

export function runRadarScanner(coins: CoinData[]): ScannerPick[] {
  return coins
    .map((coin) => {
      const rsi = computeRSI(coin);
      const volRatio = computeVolumeRatio(coin);
      const momentum = coin.change24h > 0 ? 15 : -5;
      const score = Math.min(100, Math.max(0, Math.round(
        (rsi > 30 && rsi < 70 ? 20 : 5) + volRatio * 15 + momentum + rng(coin.price) * 30
      )));
      const signals: string[] = [];
      if (rsi < 35) signals.push('RSI Oversold');
      if (rsi > 65) signals.push('RSI Overbought');
      if (volRatio > 2) signals.push('Volume Spike');
      if (coin.change24h > 3) signals.push('Strong Momentum');
      if (coin.change24h < -3) signals.push('Selling Pressure');
      return {
        ...coin,
        score,
        signals: signals.length > 0 ? signals : ['Monitoring'],
        meta: `RSI ${rsi.toFixed(0)} · Vol ×${volRatio.toFixed(1)}`,
        direction: (coin.change24h > 1 ? 'bullish' : coin.change24h < -1 ? 'bearish' : 'neutral') as ScannerPick['direction'],
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 15);
}

export function runCandleScanner(coins: CoinData[]): ScannerPick[] {
  const patterns = ['Hammer', 'Doji', 'Engulfing Bullish', 'Engulfing Bearish', 'Morning Star', 'Evening Star', 'Three White Soldiers', 'Shooting Star', 'Spinning Top', 'Marubozu'];
  return coins
    .map((coin, i) => {
      const score = Math.min(100, Math.max(0, Math.round(40 + rng(coin.price * 3) * 60)));
      const p1 = patterns[Math.floor(rng(coin.price * 11) * patterns.length)];
      const p2 = patterns[Math.floor(rng(coin.price * 13) * patterns.length)];
      return {
        ...coin,
        score,
        signals: [p1, ...(p1 !== p2 ? [p2] : [])],
        meta: `Strength ${score}% · ${coin.change24h > 0 ? '1h' : '4h'}`,
        direction: (p1.includes('Bullish') || p1 === 'Hammer' || p1 === 'Morning Star' ? 'bullish' : p1.includes('Bearish') || p1 === 'Shooting Star' || p1 === 'Evening Star' ? 'bearish' : 'neutral') as ScannerPick['direction'],
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);
}

export function runChartPatternScanner(coins: CoinData[]): ScannerPick[] {
  const patterns = ['Ascending Triangle', 'Descending Triangle', 'Double Bottom', 'Double Top', 'Head & Shoulders', 'Inv Head & Shoulders', 'Bull Flag', 'Bear Flag', 'Wedge', 'Channel Breakout'];
  return coins
    .map((coin) => {
      const score = Math.min(100, Math.max(0, Math.round(30 + rng(coin.price * 5) * 70)));
      const pattern = patterns[Math.floor(rng(coin.price * 17) * patterns.length)];
      const bullish = ['Ascending Triangle', 'Double Bottom', 'Inv Head & Shoulders', 'Bull Flag'].includes(pattern);
      return {
        ...coin,
        score,
        signals: [pattern],
        meta: `${bullish ? 'Breakout' : 'Breakdown'} · Target ${(coin.price * (1 + (bullish ? 0.05 : -0.05))).toFixed(2)}`,
        direction: (bullish ? 'bullish' : 'bearish') as ScannerPick['direction'],
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

export function runVolumeScanner(coins: CoinData[]): ScannerPick[] {
  return coins
    .map((coin) => {
      const volRatio = computeVolumeRatio(coin);
      const score = Math.min(100, Math.max(0, Math.round(volRatio * 30)));
      const signals: string[] = [];
      if (volRatio > 3) signals.push('Extreme Volume');
      else if (volRatio > 2) signals.push('High Volume');
      else if (volRatio > 1.5) signals.push('Above Average');
      else signals.push('Normal Volume');
      if (coin.change24h > 0 && volRatio > 1.5) signals.push('Buy Pressure');
      if (coin.change24h < 0 && volRatio > 1.5) signals.push('Sell Pressure');
      return {
        ...coin,
        score,
        signals,
        meta: `Vol ×${volRatio.toFixed(1)} · 24h Vol ${(coin.volume24h / 1e6).toFixed(0)}M`,
        direction: (coin.change24h > 0 ? 'bullish' : 'bearish') as ScannerPick['direction'],
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);
}

export function runWhaleScanner(coins: CoinData[]): ScannerPick[] {
  return coins
    .filter((_, i) => rng(i * 7) > 0.4)
    .map((coin) => {
      const activityScore = Math.min(100, Math.max(0, Math.round(20 + rng(coin.marketCap) * 80)));
      const signals: string[] = [];
      if (activityScore > 70) signals.push('Heavy Accumulation');
      else if (activityScore > 50) signals.push('Moderate Activity');
      else signals.push('Low Activity');
      if (rng(coin.price * 19) > 0.6) signals.push('Exchange Outflow');
      if (rng(coin.price * 23) > 0.7) signals.push('Large Transfer');
      return {
        ...coin,
        score: activityScore,
        signals,
        meta: `Whale Score ${activityScore} · ${signals.length} events`,
        direction: (activityScore > 60 ? 'bullish' : 'neutral') as ScannerPick['direction'],
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

export function runAccumulationScanner(coins: CoinData[]): ScannerPick[] {
  return coins
    .filter((_, i) => rng(i * 11) > 0.5)
    .map((coin) => {
      const score = Math.min(100, Math.max(0, Math.round(15 + rng(coin.price * 29) * 85)));
      const signals: string[] = [];
      if (score > 75) signals.push('Strong Accumulation');
      else if (score > 50) signals.push('Accumulation Phase');
      else signals.push('Early Signs');
      if (Math.abs(coin.change24h) < 2) signals.push('Low Volatility');
      if (rng(coin.price * 31) > 0.5) signals.push('Smart Money');
      return {
        ...coin,
        score,
        signals,
        meta: `Acc. Score ${score} · Vol declining`,
        direction: 'bullish' as ScannerPick['direction'],
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

export function runPrePumpScanner(coins: CoinData[]): ScannerPick[] {
  return coins
    .filter((_, i) => rng(i * 13) > 0.6)
    .map((coin) => {
      const score = Math.min(100, Math.max(0, Math.round(10 + rng(coin.price * 37) * 90)));
      const signals: string[] = [];
      if (score > 80) signals.push('Imminent Breakout');
      else if (score > 60) signals.push('Building Pressure');
      else signals.push('Compression');
      if (rng(coin.price * 41) > 0.5) signals.push('BB Squeeze');
      if (rng(coin.price * 43) > 0.6) signals.push('Volume Building');
      return {
        ...coin,
        score,
        signals,
        meta: `Pre-Pump ${score} · BB Width narrowing`,
        direction: 'bullish' as ScannerPick['direction'],
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}

export function runMultiTFScanner(coins: CoinData[]): ScannerPick[] {
  const timeframes = ['5m', '15m', '1h', '4h', '1d'];
  return coins
    .map((coin) => {
      const conditionsMet = Math.floor(rng(coin.price * 47) * 5) + 1;
      const score = Math.min(100, conditionsMet * 20);
      const confirmedTFs = timeframes.slice(0, conditionsMet);
      return {
        ...coin,
        score,
        signals: [`${conditionsMet}/5 TF Aligned`, ...confirmedTFs.map(tf => `${tf} ✓`)].slice(0, 3),
        meta: `${conditionsMet} timeframe confirmed · ${confirmedTFs.join(', ')}`,
        direction: (conditionsMet >= 3 ? 'bullish' : 'neutral') as ScannerPick['direction'],
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

export function runDivergenceScanner(coins: CoinData[]): ScannerPick[] {
  return coins
    .filter((_, i) => rng(i * 17) > 0.5)
    .map((coin) => {
      const score = Math.min(100, Math.max(0, Math.round(20 + rng(coin.price * 53) * 80)));
      const type = rng(coin.price * 59) > 0.5 ? 'Bullish' : 'Bearish';
      const hidden = rng(coin.price * 61) > 0.7;
      return {
        ...coin,
        score,
        signals: [`${hidden ? 'Hidden ' : ''}${type} Divergence`, `RSI ${computeRSI(coin).toFixed(0)}`],
        meta: `${type} Div · RSI ${computeRSI(coin).toFixed(0)} · 4h`,
        direction: (type === 'Bullish' ? 'bullish' : 'bearish') as ScannerPick['direction'],
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

export function runConfluenceScanner(coins: CoinData[], allResults: Record<string, ScannerPick[]>): ScannerPick[] {
  const scannerNames = ['radar', 'candle', 'chart', 'volume', 'whale', 'accumulation', 'prepump', 'multitf', 'divergence'];
  return coins
    .map((coin) => {
      const appearsIn: string[] = [];
      for (const name of scannerNames) {
        const results = allResults[name];
        if (results?.some(p => p.symbol === coin.symbol)) {
          appearsIn.push(name);
        }
      }
      const count = appearsIn.length;
      const score = Math.min(100, count * 20);
      return {
        ...coin,
        score,
        signals: [`${count} Scanner Match`, ...appearsIn.slice(0, 2)],
        meta: `Muncul di ${count} scanner`,
        direction: (count >= 3 ? 'bullish' : 'neutral') as ScannerPick['direction'],
      };
    })
    .filter(p => p.score >= 40)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

export function runScanner(scannerId: string, coins: CoinData[], allResults?: Record<string, ScannerPick[]>): ScannerPick[] {
  switch (scannerId) {
    case 'radar': return runRadarScanner(coins);
    case 'candle': return runCandleScanner(coins);
    case 'chart': return runChartPatternScanner(coins);
    case 'volume': return runVolumeScanner(coins);
    case 'whale': return runWhaleScanner(coins);
    case 'accumulation': return runAccumulationScanner(coins);
    case 'prepump': return runPrePumpScanner(coins);
    case 'multitf': return runMultiTFScanner(coins);
    case 'divergence': return runDivergenceScanner(coins);
    case 'confluence': return runConfluenceScanner(coins, allResults || {});
    default: return [];
  }
}
