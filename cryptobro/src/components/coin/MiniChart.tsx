'use client';

import { useEffect, useRef } from 'react';
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  ColorType,
  CrosshairMode,
} from 'lightweight-charts';
import type { IChartApi, ISeriesApi, CandlestickData, HistogramData, Time } from 'lightweight-charts';

interface OHLCVItem {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface MiniChartProps {
  ohlcv: OHLCVItem[];
  height?: number;
  isPositive: boolean;
}

export default function MiniChart({ ohlcv, height = 160, isPositive }: MiniChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // If no data, don't create chart
    if (ohlcv.length === 0) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { type: ColorType.Solid, color: '#0f1217' },
        textColor: '#929aa5',
        fontSize: 10,
      },
      grid: {
        vertLines: { color: 'rgba(43,49,57,0.3)' },
        horzLines: { color: 'rgba(43,49,57,0.3)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          labelBackgroundColor: '#1e2329',
        },
        horzLine: {
          labelBackgroundColor: '#1e2329',
        },
      },
      rightPriceScale: {
        borderColor: '#2b3139',
        scaleMargins: { top: 0.05, bottom: 0.25 },
      },
      timeScale: {
        borderColor: '#2b3139',
        timeVisible: true,
      },
      handleScroll: { mouseWheel: false, pressedMouseMove: true },
      handleScale: { mouseWheel: false, pinch: false },
    });

    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#0ecb81',
      downColor: '#f6465d',
      borderUpColor: '#0ecb81',
      borderDownColor: '#f6465d',
      wickUpColor: '#0ecb81',
      wickDownColor: '#f6465d',
    });

    candleSeriesRef.current = candleSeries;

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    }, 0);

    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    volumeSeriesRef.current = volumeSeries;

    // Format and set data
    const candleData: CandlestickData<Time>[] = ohlcv.map((d) => ({
      time: d.time as Time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    const volumeData: HistogramData<Time>[] = ohlcv.map((d) => ({
      time: d.time as Time,
      value: d.volume,
      color: d.close >= d.open ? 'rgba(14,203,129,0.25)' : 'rgba(246,70,93,0.25)',
    }));

    candleSeries.setData(candleData);
    volumeSeries.setData(volumeData);
    chart.timeScale().fitContent();

    // ResizeObserver for auto-resize
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (width > 0) {
          chart.applyOptions({ width });
        }
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [ohlcv, height]);

  // Placeholder when no data
  if (ohlcv.length === 0) {
    return (
      <div
        className="relative flex h-full w-full items-end gap-px overflow-hidden rounded-xl"
        style={{
          height,
          background: isPositive
            ? 'linear-gradient(180deg, rgba(14,203,129,0.15) 0%, rgba(14,203,129,0.02) 100%)'
            : 'linear-gradient(180deg, rgba(246,70,93,0.15) 0%, rgba(246,70,93,0.02) 100%)',
        }}
      >
        {Array.from({ length: 40 }).map((_, i) => {
          const h = 20 + Math.sin(i * 0.3) * 30 + Math.cos(i * 0.7) * 15;
          return (
            <div
              key={i}
              className="flex-1"
              style={{
                height: `${h}%`,
                backgroundColor: isPositive ? '#0ecb81' : '#f6465d',
                opacity: 0.5,
                minWidth: '1px',
              }}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden rounded-xl"
      style={{ height }}
    />
  );
}
