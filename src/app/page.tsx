import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { ChangeIndicator } from '@/components/ui/ChangeIndicator';
import { PageTimestamp } from '@/components/ui/PageTimestamp';
import { formatNumber, formatCurrency } from '@/lib/utils/format';
import { getLatestRates, getYesterdayRates } from '@/lib/api/frankfurter';
import { getMetalPrices } from '@/lib/api/metals';
import { getSchemeDetail } from '@/lib/api/mfapi';
import { CURRENCIES, DASHBOARD_CURRENCIES } from '@/lib/constants/currencies';
import { invertRate, percentChange } from '@/lib/utils/calculations';
import { getIndianIndices } from '@/lib/api/indices';
import { AutoShrinkText } from '@/components/ui/AutoShrinkText';

export const metadata = {
  title: 'Overview - Aurentum',
};

export const revalidate = 3600;

// 5 popular Indian mutual funds (Direct Growth)
const POPULAR_FUNDS = [
  { schemeCode: 125497, shortName: 'SBI Small Cap' },
  { schemeCode: 119598, shortName: 'SBI Large Cap' },
  { schemeCode: 118989, shortName: 'HDFC Mid Cap' },
  { schemeCode: 118668, shortName: 'Nippon India Growth Mid Cap' },
  { schemeCode: 120465, shortName: 'Axis Large Cap' },
];

async function getDashboardData() {
  try {
    const codes = CURRENCIES.map((c) => c.code);
    const [latestRates, yesterdayRates, metalPrices, indices, ...fundDetails] = await Promise.all([
      getLatestRates('INR', codes),
      getYesterdayRates('INR', codes),
      getMetalPrices(),
      getIndianIndices(),
      ...POPULAR_FUNDS.map((f) => getSchemeDetail(f.schemeCode)),
    ]);

    const currencyCards = DASHBOARD_CURRENCIES.map((code) => {
      const info = CURRENCIES.find((c) => c.code === code)!;
      const rate = latestRates.rates[code] ?? 0;
      const yesterdayRate = yesterdayRates.rates[code] ?? 0;
      const inverse = invertRate(rate);
      const yesterdayInverse = invertRate(yesterdayRate);
      const change = yesterdayInverse > 0 ? percentChange(inverse, yesterdayInverse) : undefined;
      return { ...info, inverseRate: inverse, change1D: change };
    });

    const fundCards = POPULAR_FUNDS.map((fund, i) => {
      const detail = fundDetails[i];
      if (!detail || !detail.data?.length) return null;
      const latestNav = parseFloat(detail.data[0].nav);
      const prevNav = detail.data.length > 1 ? parseFloat(detail.data[1].nav) : null;
      const change1D = prevNav && prevNav > 0 ? percentChange(latestNav, prevNav) : undefined;
      return {
        schemeCode: fund.schemeCode,
        shortName: fund.shortName,
        fullName: detail.meta.scheme_name,
        fundHouse: detail.meta.fund_house,
        nav: latestNav,
        change1D,
      };
    }).filter(Boolean);

    return { currencyCards, metalPrices, indices, fundCards, fetchedAt: new Date().toISOString() };
  } catch (error) {
    console.error('Dashboard data error:', error);
    return null;
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="mt-1 text-muted-foreground">
          Track currencies, precious metals, and mutual funds at a glance.
        </p>
        <PageTimestamp lastUpdated={data?.fetchedAt} />
      </div>

      {/* Currency Cards */}
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Exchange Rates</h2>
          <Link href="/currencies" className="text-sm text-accent hover:underline">
            View all &rarr;
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {data?.currencyCards ? (
            data.currencyCards.map((c) => (
              <Link key={c.code} href={`/currencies?selected=${c.code}`}>
                <Card className="flex flex-col justify-between hover:border-accent transition-colors cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{c.flag}</span>
                    <span className="text-sm font-medium">{c.code}/INR</span>
                  </div>
                  <div className="mt-2">
                    <div className="text-xl font-bold tracking-tight">
                      <AutoShrinkText>{formatCurrency(c.inverseRate)}</AutoShrinkText>
                    </div>
                    <ChangeIndicator value={c.change1D} />
                  </div>
                </Card>
              </Link>
            ))
          ) : (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-4 w-16 rounded bg-muted" />
                <div className="mt-3 h-6 w-24 rounded bg-muted" />
              </Card>
            ))
          )}
        </div>
      </section>

      {/* Metals Cards */}
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Precious Metals</h2>
          <Link href="/metals" className="text-sm text-accent hover:underline">
            View details &rarr;
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {data?.metalPrices ? (
            <>
              <Link href="/metals">
                <Card className="hover:border-accent transition-colors cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">&#x1F947;</span>
                    <span className="text-sm font-medium">Gold 24K</span>
                    {data.metalPrices.isEstimated && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                        Est.
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <div className="text-xl font-bold tracking-tight">
                      <AutoShrinkText>
                        {data.metalPrices.gold24kPerGram > 0
                          ? formatCurrency(data.metalPrices.gold24kPerGram)
                          : '--'}
                      </AutoShrinkText>
                    </div>
                    <ChangeIndicator value={data.metalPrices.goldChange1D} />
                  </div>
                  <p className="text-xs text-muted-foreground">per gram</p>
                </Card>
              </Link>
              <Link href="/metals">
                <Card className="hover:border-accent transition-colors cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">&#x1F948;</span>
                    <span className="text-sm font-medium">Silver 999</span>
                    {data.metalPrices.isEstimated && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                        Est.
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <div className="text-xl font-bold tracking-tight">
                      <AutoShrinkText>
                        {data.metalPrices.silver999PerGram > 0
                          ? formatCurrency(data.metalPrices.silver999PerGram)
                          : '--'}
                      </AutoShrinkText>
                    </div>
                    <ChangeIndicator value={data.metalPrices.silverChange1D} />
                  </div>
                  <p className="text-xs text-muted-foreground">per gram</p>
                </Card>
              </Link>
            </>
          ) : (
            Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-4 w-20 rounded bg-muted" />
                <div className="mt-3 h-6 w-28 rounded bg-muted" />
              </Card>
            ))
          )}
        </div>
      </section>

      {/* Market Indices */}
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Market Indices</h2>
          <Link href="/market-indices" className="text-sm text-accent hover:underline">
            View all &rarr;
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data?.indices && data.indices.length > 0 ? (
            data.indices.map((idx) => (
              <Link key={idx.symbol} href={`/market-indices/${encodeURIComponent(idx.symbol)}`}>
                <Card className="flex flex-col justify-between hover:border-accent transition-colors cursor-pointer h-full">
                  <p className="text-sm font-medium">{idx.shortName}</p>
                  <div className="mt-2">
                    <div className="text-xl font-bold tracking-tight">
                      <AutoShrinkText>{formatCurrency(idx.price)}</AutoShrinkText>
                    </div>
                    <ChangeIndicator value={idx.change1D} />
                  </div>
                </Card>
              </Link>
            ))
          ) : (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-4 w-20 rounded bg-muted" />
                <div className="mt-3 h-6 w-24 rounded bg-muted" />
              </Card>
            ))
          )}
        </div>
      </section>

      {/* Mutual Fund Cards */}
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Mutual Funds</h2>
          <Link href="/mutual-funds" className="text-sm text-accent hover:underline">
            View all &rarr;
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {data?.fundCards && data.fundCards.length > 0 ? (
            data.fundCards.map((fund) => (
              <Link key={fund!.schemeCode} href={`/mutual-funds/${fund!.schemeCode}`}>
                <Card className="flex flex-col justify-between hover:border-accent transition-colors cursor-pointer h-full">
                  <div>
                    <p className="text-sm font-medium leading-tight">{fund!.shortName}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground truncate">{fund!.fundHouse}</p>
                  </div>
                  <div className="mt-2">
                    <div className="text-xl font-bold tracking-tight">
                      <AutoShrinkText>{formatCurrency(fund!.nav)}</AutoShrinkText>
                    </div>
                    <ChangeIndicator value={fund!.change1D} />
                  </div>
                </Card>
              </Link>
            ))
          ) : (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-4 w-20 rounded bg-muted" />
                <div className="mt-3 h-6 w-24 rounded bg-muted" />
              </Card>
            ))
          )}
        </div>
      </section>

      {/* Quick Links */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Explore</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/currencies"
            className="rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-accent"
          >
            <h3 className="font-medium">Currency Exchange</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Converter, charts, and historical rates
            </p>
          </Link>
          <Link
            href="/metals"
            className="rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-accent"
          >
            <h3 className="font-medium">Precious Metals</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Purity calculator and price trends
            </p>
          </Link>
          <Link
            href="/market-indices"
            className="rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-accent"
          >
            <h3 className="font-medium">Market Indices</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Indian and international index tracking
            </p>
          </Link>
          <Link
            href="/mutual-funds"
            className="rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-accent"
          >
            <h3 className="font-medium">Mutual Funds</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Search, browse, and analyse NAV history
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
}
