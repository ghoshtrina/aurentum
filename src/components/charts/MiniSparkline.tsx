'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { createChart, LineSeries, type IChartApi, type SingleValueData, type Time } from 'lightweight-charts';

interface MiniSparklineProps {
  data: SingleValueData<Time>[];
  width?: number;
  height?: number;
  color?: string;
}

export function MiniSparkline({ data, width = 100, height = 40, color }: MiniSparklineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    const lineColor = color ?? '#c89b3c';

    const chart = createChart(containerRef.current, {
      width,
      height,
      layout: {
        background: { color: 'transparent' },
        textColor: 'transparent',
        attributionLogo: false,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      rightPriceScale: { visible: false },
      timeScale: { visible: false },
      crosshair: {
        vertLine: { visible: false },
        horzLine: { visible: false },
      },
      handleScroll: false,
      handleScale: false,
    });

    const series = chart.addSeries(LineSeries, {
      color: lineColor,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    series.setData(data);
    chart.timeScale().fitContent();
    chartRef.current = chart;

    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, [data, width, height, color, isDark]);

  return <div ref={containerRef} />;
}
