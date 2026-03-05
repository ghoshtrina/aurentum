'use client';

import { useMemo, useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { ChangeIndicator } from '@/components/ui/ChangeIndicator';
import { PriceChart } from '@/components/charts/PriceChart';
import { TimeRangeSelector } from '@/components/ui/TimeRangeSelector';
import { useTimeRange } from '@/hooks/useTimeRange';
import { formatCurrency } from '@/lib/utils/format';
import { AutoShrinkText } from '@/components/ui/AutoShrinkText';
import { getDateForRange } from '@/lib/utils/calculations';
import { toChartData } from '@/lib/utils/chart-helpers';
import Link from 'next/link';
import { PageTimestamp } from '@/components/ui/PageTimestamp';

const RANGES = ['1M', '3M', '6M', '1Y', '3Y', '5Y', 'All'];

interface IndexDetailClientProps {
  symbol: string;
  name: string;
  category: string;
  currency: 'INR' | 'USD';
  currentPrice: number;
  priceInINR?: number;
  change1D?: number;
  return1Y?: number;
  return3Y?: number;
  return5Y?: number;
  high52W?: number;
  low52W?: number;
  latestDate?: string;
  marketClosed?: boolean;
}

interface HistoryPoint {
  date: string;
  price: number;
}

export function IndexDetailClient({
  symbol,
  name,
  category,
  currency,
  currentPrice,
  priceInINR,
  change1D,
  return1Y,
  return3Y,
  return5Y,
  high52W,
  low52W,
  latestDate,
  marketClosed,
}: IndexDetailClientProps) {
  const { range, setRange } = useTimeRange('1Y');
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const startDate = range === 'All'
      ? '2000-01-01'
      : getDateForRange(range);

    setLoading(true);
    fetch(`/api/indices/history?symbol=${encodeURIComponent(symbol)}&start=${startDate}`)
      .then((res) => res.json())
      .then((data) => {
        setHistory(data.history ?? []);
      })
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [symbol, range]);

  const chartData = useMemo(() => {
    return toChartData(history.map((d) => ({ date: d.date, value: d.price })));
  }, [history]);

  const isUSD = currency === 'USD';

  return (
    <div className="space-y-6">
      {marketClosed && (
        <div className="rounded-xl border border-border bg-card p-4 text-center text-sm text-muted-foreground">
          Markets are closed right now. Showing latest available data.
        </div>
      )}

      <div>
        <Link
          href="/market-indices"
          className="mb-3 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mr-1 h-4 w-4">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
          Back to Market Indices
        </Link>
        <h1 className="text-xl font-bold tracking-tight">{name}</h1>
        <PageTimestamp lastUpdated={latestDate} />
        <span className="mt-1 inline-block rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          {category}
        </span>
      </div>

      {/* Metrics */}
      <div className={`grid gap-4 grid-cols-2 sm:grid-cols-3 ${isUSD ? 'lg:grid-cols-8' : 'lg:grid-cols-7'}`}>
        <Card>
          <p className="text-xs text-muted-foreground">Current Price</p>
          <div className="mt-1 text-lg font-bold">
            <AutoShrinkText>{formatCurrency(currentPrice, currency)}</AutoShrinkText>
          </div>
        </Card>
        {isUSD && priceInINR !== undefined && (
          <Card>
            <p className="text-xs text-muted-foreground">Price in INR</p>
            <div className="mt-1 text-lg font-bold">
              <AutoShrinkText>{formatCurrency(priceInINR, 'INR')}</AutoShrinkText>
            </div>
          </Card>
        )}
        <Card>
          <p className="text-xs text-muted-foreground">1D Change</p>
          <div className="mt-1">
            <ChangeIndicator value={change1D} className="text-lg font-bold" />
          </div>
        </Card>
        <Card>
          <p className="text-xs text-muted-foreground">1Y Return</p>
          <div className="mt-1">
            <ChangeIndicator value={return1Y} className="text-lg font-bold" />
          </div>
        </Card>
        <Card>
          <p className="text-xs text-muted-foreground">3Y Return</p>
          <div className="mt-1">
            <ChangeIndicator value={return3Y} className="text-lg font-bold" />
          </div>
        </Card>
        <Card>
          <p className="text-xs text-muted-foreground">5Y Return</p>
          <div className="mt-1">
            <ChangeIndicator value={return5Y} className="text-lg font-bold" />
          </div>
        </Card>
        <Card>
          <p className="text-xs text-muted-foreground">52W High</p>
          <div className="mt-1 text-lg font-bold">
            <AutoShrinkText>{high52W ? formatCurrency(high52W, currency) : '--'}</AutoShrinkText>
          </div>
        </Card>
        <Card>
          <p className="text-xs text-muted-foreground">52W Low</p>
          <div className="mt-1 text-lg font-bold">
            <AutoShrinkText>{low52W ? formatCurrency(low52W, currency) : '--'}</AutoShrinkText>
          </div>
        </Card>
      </div>

      {/* Price Chart */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Price History</h3>
          <TimeRangeSelector ranges={RANGES} selected={range} onChange={setRange} />
        </div>
        {loading ? (
          <div className="flex h-[350px] items-center justify-center text-sm text-muted-foreground">
            Loading chart data...
          </div>
        ) : chartData.length > 0 ? (
          <PriceChart data={chartData} height={350} />
        ) : (
          <div className="flex h-[350px] items-center justify-center text-sm text-muted-foreground">
            No data available for this period
          </div>
        )}
      </Card>
    </div>
  );
}
