import { getSchemeDetail } from '@/lib/api/mfapi';
import { FundDetailClient } from './FundDetailClient';

// Hourly page-level ISR; fetch-level revalidation is market-hours-aware
export const revalidate = 3600;

interface Props {
  params: Promise<{ schemeCode: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { schemeCode } = await params;
  const code = parseInt(schemeCode, 10);
  const detail = await getSchemeDetail(code);
  return {
    title: detail
      ? `${detail.meta.scheme_name} - Aurentum`
      : 'Fund Detail - Aurentum',
  };
}

export default async function FundDetailPage({ params }: Props) {
  const { schemeCode } = await params;
  const code = parseInt(schemeCode, 10);
  const detail = await getSchemeDetail(code);

  if (!detail) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          Fund not found or API unavailable.
        </div>
      </div>
    );
  }

  // Parse NAV data
  const navData = detail.data
    .map((d) => {
      const parts = d.date.split('-');
      const isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
      return {
        date: isoDate,
        nav: parseFloat(d.nav),
      };
    })
    .filter((d) => !isNaN(d.nav) && d.nav > 0)
    .sort((a, b) => a.date.localeCompare(b.date));

  const currentNAV = navData.length > 0 ? navData[navData.length - 1].nav : 0;

  // Calculate returns
  const findNAVDaysAgo = (days: number) => {
    if (navData.length === 0) return undefined;
    const target = new Date();
    target.setDate(target.getDate() - days);
    const targetTime = target.getTime();
    const closest = navData.reduce((prev, curr) => {
      const prevDiff = Math.abs(new Date(prev.date).getTime() - targetTime);
      const currDiff = Math.abs(new Date(curr.date).getTime() - targetTime);
      return currDiff < prevDiff ? curr : prev;
    });
    return closest?.nav;
  };

  const calcReturn = (pastNAV: number | undefined, years: number) => {
    if (!pastNAV || pastNAV <= 0) return undefined;
    if (years <= 1) {
      return ((currentNAV - pastNAV) / pastNAV) * 100;
    }
    // CAGR for multi-year periods
    return (Math.pow(currentNAV / pastNAV, 1 / years) - 1) * 100;
  };

  const return1Y = calcReturn(findNAVDaysAgo(365), 1);
  const return3Y = calcReturn(findNAVDaysAgo(1095), 3);
  const return5Y = calcReturn(findNAVDaysAgo(1825), 5);

  // 52-week high/low
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const oneYearStr = oneYearAgo.toISOString().split('T')[0];
  const lastYearNAVs = navData
    .filter((d) => d.date >= oneYearStr)
    .map((d) => d.nav);
  const high52W = lastYearNAVs.length > 0 ? Math.max(...lastYearNAVs) : undefined;
  const low52W = lastYearNAVs.length > 0 ? Math.min(...lastYearNAVs) : undefined;

  const latestDate = navData.length > 0 ? navData[navData.length - 1].date : undefined;

  // If latest NAV date is >2 calendar days old, markets are likely closed (holiday/weekend)
  let marketClosed = false;
  if (latestDate) {
    const latestMs = new Date(latestDate).getTime();
    const nowMs = Date.now();
    const diffDays = (nowMs - latestMs) / (1000 * 60 * 60 * 24);
    marketClosed = diffDays > 2;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <FundDetailClient
        meta={detail.meta}
        navData={navData}
        currentNAV={currentNAV}
        return1Y={return1Y}
        return3Y={return3Y}
        return5Y={return5Y}
        high52W={high52W}
        low52W={low52W}
        latestDate={new Date().toISOString()}
        marketClosed={marketClosed}
      />
    </div>
  );
}
