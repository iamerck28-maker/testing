import type { OHLCV, BacktestTrade, BacktestResult } from './types';

function computeSMA(values: number[], period: number): (number | null)[] {
  return values.map((_, i) => {
    if (i < period - 1) return null;
    const slice = values.slice(i - period + 1, i + 1);
    return slice.reduce((a, b) => a + b, 0) / period;
  });
}

export function computeRSI(closes: number[], period = 14): number[] {
  if (closes.length < period + 1) return [];
  const changes = closes.slice(1).map((c, i) => c - closes[i]);
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 0; i < period; i++) {
    const ch = changes[i];
    if (ch > 0) avgGain += ch;
    else avgLoss += Math.abs(ch);
  }
  avgGain /= period;
  avgLoss /= period;
  const rsi: number[] = [];
  const rs0 = avgLoss === 0 ? Infinity : avgGain / avgLoss;
  rsi.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + rs0));
  for (let i = period; i < changes.length; i++) {
    const ch = changes[i];
    avgGain = (avgGain * (period - 1) + Math.max(ch, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-ch, 0)) / period;
    const rs = avgLoss === 0 ? Infinity : avgGain / avgLoss;
    rsi.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + rs));
  }
  return rsi;
}

function buildResult(
  strategy: string,
  symbol: string,
  trades: BacktestTrade[],
  ohlcv: OHLCV[],
): BacktestResult {
  const wins = trades.filter((t) => t.returnPct > 0).length;
  let value = 1;
  let peak = 1;
  let maxDrawdown = 0;
  for (const t of trades) {
    value *= 1 + t.returnPct / 100;
    if (value > peak) peak = value;
    const dd = (peak - value) / peak;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }
  return {
    strategy,
    symbol,
    tradeCount: trades.length,
    winRate: trades.length > 0 ? (wins / trades.length) * 100 : 0,
    totalReturn: (value - 1) * 100,
    maxDrawdown: maxDrawdown * 100,
    trades,
    startDate: ohlcv[0]?.time ?? 0,
    endDate: ohlcv[ohlcv.length - 1]?.time ?? 0,
  };
}

export function runMACrossover(ohlcv: OHLCV[], symbol: string): BacktestResult {
  const closes = ohlcv.map((c) => c.close);
  const ma20 = computeSMA(closes, 20);
  const ma50 = computeSMA(closes, 50);
  const trades: BacktestTrade[] = [];
  let entryPrice: number | null = null;
  let entryDate = 0;

  for (let i = 51; i < ohlcv.length; i++) {
    const m20 = ma20[i]!;
    const m50 = ma50[i]!;
    const pm20 = ma20[i - 1]!;
    const pm50 = ma50[i - 1]!;
    if (entryPrice === null && pm20 <= pm50 && m20 > m50) {
      entryPrice = ohlcv[i].close;
      entryDate = ohlcv[i].time;
    } else if (entryPrice !== null && pm20 >= pm50 && m20 < m50) {
      const exitPrice = ohlcv[i].close;
      trades.push({
        entryDate,
        exitDate: ohlcv[i].time,
        entryPrice,
        exitPrice,
        returnPct: ((exitPrice - entryPrice) / entryPrice) * 100,
      });
      entryPrice = null;
    }
  }

  return buildResult('MA Crossover (20/50)', symbol, trades, ohlcv);
}

export function runRSIStrategy(ohlcv: OHLCV[], symbol: string): BacktestResult {
  const closes = ohlcv.map((c) => c.close);
  const rsiValues = computeRSI(closes, 14);
  const trades: BacktestTrade[] = [];
  let entryPrice: number | null = null;
  let entryDate = 0;

  for (let i = 0; i < rsiValues.length; i++) {
    const ohlcvIdx = i + 14;
    if (ohlcvIdx >= ohlcv.length) break;
    const rsi = rsiValues[i];
    if (entryPrice === null && rsi < 30) {
      entryPrice = ohlcv[ohlcvIdx].close;
      entryDate = ohlcv[ohlcvIdx].time;
    } else if (entryPrice !== null && rsi > 70) {
      const exitPrice = ohlcv[ohlcvIdx].close;
      trades.push({
        entryDate,
        exitDate: ohlcv[ohlcvIdx].time,
        entryPrice,
        exitPrice,
        returnPct: ((exitPrice - entryPrice) / entryPrice) * 100,
      });
      entryPrice = null;
    }
  }

  return buildResult('RSI Strategy (30/70)', symbol, trades, ohlcv);
}

export type BacktestStrategy = 'ma_crossover' | 'rsi_strategy';

export function runBacktest(
  ohlcv: OHLCV[],
  symbol: string,
  strategy: BacktestStrategy,
): BacktestResult {
  if (strategy === 'ma_crossover') return runMACrossover(ohlcv, symbol);
  return runRSIStrategy(ohlcv, symbol);
}
