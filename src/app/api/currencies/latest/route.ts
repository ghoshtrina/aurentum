import { NextResponse } from 'next/server';
import { getLatestRates, getYesterdayRates } from '@/lib/api/frankfurter';
import { CURRENCIES } from '@/lib/constants/currencies';
import { invertRate, percentChange } from '@/lib/utils/calculations';

export const revalidate = 3600;

export async function GET() {
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

    return NextResponse.json({
      date: latest.date,
      base: 'INR',
      rates,
    });
  } catch (error) {
    console.error('Currency latest API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch currency rates' },
      { status: 500 }
    );
  }
}
