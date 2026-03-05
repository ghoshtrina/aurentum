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

interface CurrencyChartProps {
  currencyCode: string;
}

export function CurrencyChart({ currencyCode }: CurrencyChartProps) {
  const { range, setRange } = useTimeRange('1Y');
  const [chartData, setChartData] = useState<SingleValueData<Time>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const startDate = getDateForRange(range);

    fetch(`/api/currencies/history?currency=${currencyCode}&start=${startDate}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.history) {
          setChartData(
            toChartData(data.history.map((h: { date: string; rate: number }) => ({
              date: h.date,
              value: h.rate,
            })))
          );
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currencyCode, range]);

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          1 {currencyCode} = INR
        </h3>
        <TimeRangeSelector ranges={RANGES} selected={range} onChange={setRange} />
      </div>
      {loading ? (
        <Skeleton className="h-[300px] w-full" />
      ) : chartData.length > 0 ? (
        <PriceChart data={chartData} height={300} />
      ) : (
        <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
          No data available
        </div>
      )}
    </Card>
  );
}
