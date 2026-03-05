import { Suspense } from 'react';
import { CurrenciesClient } from './CurrenciesClient';
import { PageTimestamp } from '@/components/ui/PageTimestamp';
import { getLatestRates, getYesterdayRates } from '@/lib/api/frankfurter';
import { CURRENCIES } from '@/lib/constants/currencies';
import { invertRate, percentChange } from '@/lib/utils/calculations';

export const metadata = {
  title: 'Currencies - Aurentum',
  description: 'INR exchange rates, currency converter, and trend charts',
};

export const revalidate = 3600;

async function getCurrencyRates() {
  try {
    const codes = CURRENCIES.map((c) => c.code);
    const [latest, yesterday] = await Promise.all([
      getLatestRates('INR', codes),
      getYesterdayRates('INR', codes),
    ]);

    const rates = CURRENCIES.map((currency) => {
      const ratePerINR = latest.rates[currency.code] ?? 0;
      const yesterdayRate = yesterday.rates[currency.code] ?? 0;
      const inverse = invertRate(ratePerINR);
      const yesterdayInverse = invertRate(yesterdayRate);
      const change1D =
        yesterdayInverse > 0 ? percentChange(inverse, yesterdayInverse) : undefined;

      return {
        code: currency.code,
        name: currency.name,
        symbol: currency.symbol,
        flag: currency.flag,
        ratePerINR,
        inverseRate: inverse,
        change1D,
      };
    });

    return { date: latest.date, base: 'INR', rates, fetchedAt: new Date().toISOString() };
  } catch (error) {
    console.error('Failed to fetch currency data:', error);
    return null;
  }
}

export default async function CurrenciesPage() {
  const data = await getCurrencyRates();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Currency Exchange Rates</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          INR-centric exchange rates updated hourly
        </p>
        <PageTimestamp lastUpdated={data?.fetchedAt} />
      </div>
      <Suspense>
        <CurrenciesClient initialData={data} />
      </Suspense>
    </div>
  );
}
