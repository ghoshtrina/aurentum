'use client';

import { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { ChangeIndicator } from '@/components/ui/ChangeIndicator';
import { PriceChart } from '@/components/charts/PriceChart';
import { TimeRangeSelector } from '@/components/ui/TimeRangeSelector';
import { useTimeRange } from '@/hooks/useTimeRange';
import { formatNumber, formatCurrency } from '@/lib/utils/format';
import { AutoShrinkText } from '@/components/ui/AutoShrinkText';
import { getDateForRange } from '@/lib/utils/calculations';
import { toChartData } from '@/lib/utils/chart-helpers';
import Link from 'next/link';
import { PageTimestamp } from '@/components/ui/PageTimestamp';

const RANGES = ['1M', '3M', '6M', '1Y', '3Y', '5Y', 'All'];

interface FundDetailClientProps {
  meta: {
    fund_house: string;
    scheme_type: string;
    scheme_category: string;
    scheme_code: number;
    scheme_name: string;
  };
  navData: Array<{ date: string; nav: number }>;
  currentNAV: number;
  return1Y?: number;
  return3Y?: number;
  return5Y?: number;
  high52W?: number;
  low52W?: number;
  latestDate?: string;
  marketClosed?: boolean;
}

export function FundDetailClient({
  meta,
  navData,
  currentNAV,
  return1Y,
  return3Y,
  return5Y,
  high52W,
  low52W,
  latestDate,
  marketClosed,
}: FundDetailClientProps) {
  const { range, setRange } = useTimeRange('1Y');

  const chartData = useMemo(() => {
    if (range === 'All') {
      return toChartData(navData.map((d) => ({ date: d.date, value: d.nav })));
    }
    const startDate = getDateForRange(range);
    const filtered = navData.filter((d) => d.date >= startDate);
    return toChartData(filtered.map((d) => ({ date: d.date, value: d.nav })));
  }, [navData, range]);

  return (
    <div className="space-y-6">
      {marketClosed && (
        <div className="rounded-xl border border-border bg-card p-4 text-center text-sm text-muted-foreground">
          Indian markets are closed today. Showing latest available NAV.
        </div>
      )}
      <div>
        <Link
          href="/mutual-funds"
          className="mb-3 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mr-1 h-4 w-4">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
          Back to Mutual Funds
        </Link>
        <h1 className="text-xl font-bold tracking-tight">{meta.scheme_name}</h1>
        <PageTimestamp lastUpdated={latestDate} />
        <div className="mt-1 flex flex-wrap gap-2 text-sm text-muted-foreground">
          <span>{meta.fund_house}</span>
          <span>&middot;</span>
          <span>{meta.scheme_category || meta.scheme_type}</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        <Card>
          <p className="text-xs text-muted-foreground">Current NAV</p>
          <div className="mt-1 text-lg font-bold">
            <AutoShrinkText>{formatCurrency(currentNAV)}</AutoShrinkText>
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
            <AutoShrinkText>{high52W ? formatCurrency(high52W) : '--'}</AutoShrinkText>
          </div>
        </Card>
        <Card>
          <p className="text-xs text-muted-foreground">52W Low</p>
          <div className="mt-1 text-lg font-bold">
            <AutoShrinkText>{low52W ? formatCurrency(low52W) : '--'}</AutoShrinkText>
          </div>
        </Card>
      </div>

      {/* NAV Chart */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">NAV History</h3>
          <TimeRangeSelector ranges={RANGES} selected={range} onChange={setRange} />
        </div>
        {chartData.length > 0 ? (
          <PriceChart data={chartData} height={350} />
        ) : (
          <div className="flex h-[350px] items-center justify-center text-sm text-muted-foreground">
            No NAV data available for this period
          </div>
        )}
      </Card>
    </div>
  );
}
