'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { PriceChart } from '@/components/charts/PriceChart';
import { TimeRangeSelector } from '@/components/ui/TimeRangeSelector';
import { Skeleton } from '@/components/ui/Skeleton';
import { useTimeRange } from '@/hooks/useTimeRange';
import { getDateForRange } from '@/lib/utils/calculations';
import { toChartData } from '@/lib/utils/chart-helpers';
import type { SingleValueData, Time } from 'lightweight-charts';

const RANGES = ['1M', '3M', '6M', '1Y', '3Y'];

interface MetalChartProps {
  metal: 'gold' | 'silver';
  label: string;
  currentPricePerGram: number;
}

export function MetalChart({ metal, label, currentPricePerGram }: MetalChartProps) {
  const { range, setRange } = useTimeRange('1Y');
  const [chartData, setChartData] = useState<SingleValueData<Time>[]>([]);
  const [loading, setLoading] = useState(true);
  const [noData, setNoData] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNoData(false);
    const startDate = getDateForRange(range);

    fetch(`/api/metals/history?metal=${metal}&start=${startDate}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.history && data.history.length > 0) {
          const history: { date: string; price: number }[] = data.history;
          // ETF prices (GOLDBEES/SILVERBEES) don't match actual per-gram prices.
          // Scale proportionally so the chart reflects real INR/gram values.
          const latestETF = history[history.length - 1].price;
          const scale = latestETF > 0 && currentPricePerGram > 0
            ? currentPricePerGram / latestETF
            : 1;
          setChartData(
            toChartData(
              history.map((h) => ({
                date: h.date,
                value: h.price * scale,
              }))
            )
          );
        } else {
          setNoData(true);
        }
      })
      .catch(() => setNoData(true))
      .finally(() => setLoading(false));
  }, [metal, range]);

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          {label} Price Trend (INR)
        </h3>
        <TimeRangeSelector ranges={RANGES} selected={range} onChange={setRange} />
      </div>
      {loading ? (
        <Skeleton className="h-[300px] w-full" />
      ) : noData ? (
        <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
          Historical data is currently unavailable. Please try again later.
        </div>
      ) : (
        <PriceChart data={chartData} height={300} />
      )}
    </Card>
  );
}
