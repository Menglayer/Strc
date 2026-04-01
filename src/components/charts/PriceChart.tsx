import React, { useEffect, useRef } from 'react';
import { createChart, AreaSeries, ColorType, type IChartApi, type UTCTimestamp, type AreaData } from 'lightweight-charts';
import { Skeleton } from '../ui/Skeleton';

export interface PriceChartProps {
  data: Array<{ time: number; value: number }>;
  loading?: boolean;
  height?: number;
  lineColor?: string;
  topColor?: string;
  bottomColor?: string;
}

export function PriceChart({
  data,
  loading = false,
  height = 400,
  lineColor = '#F7931A',
  topColor = 'rgba(247,147,26,0.3)',
  bottomColor = 'rgba(247,147,26,0.02)'
}: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current || loading || data.length === 0) return;

    const chart = createChart(containerRef.current, {
      height,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#6b7280',
        fontFamily: 'JetBrains Mono, monospace',
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.03)' },
        horzLines: { color: 'rgba(255,255,255,0.03)' },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: 'rgba(247,147,26,0.3)' },
        horzLine: { color: 'rgba(247,147,26,0.3)' },
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.1)',
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.1)',
      },
      handleScroll: false,
      handleScale: false,
    });
    chartRef.current = chart;

    const series = chart.addSeries(AreaSeries, {
      lineColor,
      topColor,
      bottomColor,
      lineWidth: 2,
    });

    const chartData: AreaData[] = data.map((d) => ({
      time: d.time as UTCTimestamp,
      value: d.value,
    }));
    series.setData(chartData);

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [data, loading, height, lineColor, topColor, bottomColor]);

  if (loading || data.length === 0) {
    return (
      <div className="w-full rounded-lg border border-dashed border-white/10 bg-dark/30" style={{ height }}>
        <div className="flex h-full w-full items-center justify-center p-8">
           <Skeleton className="w-full h-full opacity-10" />
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className="w-full" style={{ height }} />;
}
