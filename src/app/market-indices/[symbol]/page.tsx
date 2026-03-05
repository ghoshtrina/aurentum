import { getIndexBySymbol } from '@/lib/constants/indices';
import { getIndexHistory } from '@/lib/api/indices';
import { getLatestRates } from '@/lib/api/frankfurter';
import { invertRate } from '@/lib/utils/calculations';
import { IndexDetailClient } from './IndexDetailClient';

export const revalidate = 3600;

interface Props {
  params: Promise<{ symbol: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { symbol } = await params;
  const decoded = decodeURIComponent(symbol);
  const info = getIndexBySymbol(decoded);
  return {
    title: info ? `${info.shortName} - Aurentum` : 'Index Detail - Aurentum',
  };
}

export default async function IndexDetailPage({ params }: Props) {
  const { symbol } = await params;
  const decoded = decodeURIComponent(symbol);
  const info = getIndexBySymbol(decoded);

  if (!info) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          Index not found.
        </div>
      </div>
    );
  }

  // Fetch 5Y of daily data
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
  const startDate = fiveYearsAgo.toISOString().split('T')[0];
  const history = await getIndexHistory(decoded, startDate);

  if (history.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          No data available for {info.shortName}.
        </div>
      </div>
    );
  }

  const currentPrice = history[history.length - 1].price;

  // 1D change from last two data points
  const prevPrice = history.length > 1 ? history[history.length - 2].price : undefined;
  const change1D = prevPrice && prevPrice > 0
    ? ((currentPrice - prevPrice) / prevPrice) * 100
    : undefined;

  // Returns (CAGR for multi-year)
  const findPriceDaysAgo = (days: number) => {
    const target = new Date();
    target.setDate(target.getDate() - days);
    const targetTime = target.getTime();
    const closest = history.reduce((prev, curr) => {
      const prevDiff = Math.abs(new Date(prev.date).getTime() - targetTime);
      const currDiff = Math.abs(new Date(curr.date).getTime() - targetTime);
      return currDiff < prevDiff ? curr : prev;
    });
    return closest?.price;
  };

  const calcReturn = (pastPrice: number | undefined, years: number) => {
    if (!pastPrice || pastPrice <= 0) return undefined;
    if (years <= 1) {
      return ((currentPrice - pastPrice) / pastPrice) * 100;
    }
    return (Math.pow(currentPrice / pastPrice, 1 / years) - 1) * 100;
  };

  const return1Y = calcReturn(findPriceDaysAgo(365), 1);
  const return3Y = calcReturn(findPriceDaysAgo(1095), 3);
  const return5Y = calcReturn(findPriceDaysAgo(1825), 5);

  // 52-week high/low
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const oneYearStr = oneYearAgo.toISOString().split('T')[0];
  const lastYearPrices = history
    .filter((d) => d.date >= oneYearStr)
    .map((d) => d.price);
  const high52W = lastYearPrices.length > 0 ? Math.max(...lastYearPrices) : undefined;
  const low52W = lastYearPrices.length > 0 ? Math.min(...lastYearPrices) : undefined;

  // Market closed detection (staleness >2 days)
  const latestDate = history[history.length - 1].date;
  const latestMs = new Date(latestDate).getTime();
  const diffDays = (Date.now() - latestMs) / (1000 * 60 * 60 * 24);
  const marketClosed = diffDays > 2;

  // For international (USD) indices, fetch USD→INR rate
  let priceInINR: number | undefined;
  if (info.currency === 'USD') {
    try {
      const rates = await getLatestRates('INR', ['USD']);
      // Frankfurter gives 1 INR = X USD, invert to get 1 USD = Y INR
      const usdToInr = invertRate(rates.rates['USD'] ?? 0);
      if (usdToInr > 0) {
        priceInINR = currentPrice * usdToInr;
      }
    } catch {
      // Ignore — priceInINR stays undefined
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <IndexDetailClient
        symbol={decoded}
        name={info.shortName}
        category={info.category}
        currency={info.currency}
        currentPrice={currentPrice}
        priceInINR={priceInINR}
        change1D={change1D}
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
