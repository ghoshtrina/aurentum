'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { createChart, AreaSeries, type IChartApi, type SingleValueData, type Time } from 'lightweight-charts';
import { getChartColors } from '@/lib/utils/chart-helpers';

interface PriceChartProps {
  data: SingleValueData<Time>[];
  height?: number;
  className?: string;
}

export function PriceChart({ data, height = 300, className }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const colors = getChartColors(isDark);

    const chart = createChart(chartContainerRef.current, {
      height,
      layout: {
        background: { color: colors.backgroundColor },
        textColor: colors.textColor,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: colors.gridColor },
        horzLines: { color: colors.gridColor },
      },
      rightPriceScale: {
        borderColor: colors.gridColor,
      },
      timeScale: {
        borderColor: colors.gridColor,
        timeVisible: false,
      },
      crosshair: {
        horzLine: {
          color: colors.lineColor,
          labelBackgroundColor: colors.lineColor,
        },
        vertLine: {
          color: colors.lineColor,
          labelBackgroundColor: colors.lineColor,
        },
      },
    });

    const series = chart.addSeries(AreaSeries, {
      lineColor: colors.lineColor,
      topColor: colors.areaTopColor,
      bottomColor: colors.areaBottomColor,
      lineWidth: 2,
    });

    series.setData(data);
    chart.timeScale().fitContent();
    chartRef.current = chart;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [data, height, isDark]);

  return <div ref={chartContainerRef} className={className} />;
}
