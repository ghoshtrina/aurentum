'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { formatNumber } from '@/lib/utils/format';
import { getDateForRange } from '@/lib/utils/calculations';

interface Currency52WeekProps {
  currencyCode: string;
  currentRate: number;
}

export function Currency52Week({ currencyCode, currentRate }: Currency52WeekProps) {
  const [high, setHigh] = useState<number | null>(null);
  const [low, setLow] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const startDate = getDateForRange('1Y');

    fetch(`/api/currencies/history?currency=${currencyCode}&start=${startDate}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.history && data.history.length > 0) {
          const rates = data.history.map((h: { rate: number }) => h.rate);
          setHigh(Math.max(...rates));
          setLow(Math.min(...rates));
        } else {
          setHigh(null);
          setLow(null);
        }
      })
      .catch(() => {
        setHigh(null);
        setLow(null);
      })
      .finally(() => setLoading(false));
  }, [currencyCode]);

  if (loading) {
    return (
      <Card className="p-4 animate-pulse">
        <div className="h-4 w-24 rounded bg-muted" />
        <div className="mt-3 h-5 w-full rounded bg-muted" />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="h-4 rounded bg-muted" />
          <div className="h-4 rounded bg-muted" />
        </div>
      </Card>
    );
  }

  if (high == null || low == null) return null;

  const range = high - low;
  const position = range > 0 ? ((currentRate - low) / range) * 100 : 50;

  return (
    <Card className="p-4">
      <h3 className="mb-3 text-sm font-medium text-muted-foreground">
        52-Week Range ({currencyCode}/INR)
      </h3>

      {/* Range bar */}
      <div className="relative mb-3">
        <div className="h-2 rounded-full bg-muted" />
        <div
          className="absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full border-2 border-accent bg-card"
          style={{ left: `calc(${Math.min(Math.max(position, 0), 100)}% - 7px)` }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <div>
          <span className="block font-medium text-foreground">{formatNumber(low, 4)}</span>
          <span>Low</span>
        </div>
        <div className="text-center">
          <span className="block font-medium text-accent">{formatNumber(currentRate, 4)}</span>
          <span>Current</span>
        </div>
        <div className="text-right">
          <span className="block font-medium text-foreground">{formatNumber(high, 4)}</span>
          <span>High</span>
        </div>
      </div>
    </Card>
  );
}
