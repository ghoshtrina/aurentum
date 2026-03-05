import { NextRequest, NextResponse } from 'next/server';
import { getHistoricalRates, getLatestRates } from '@/lib/api/frankfurter';
import { invertRate } from '@/lib/utils/calculations';

export const revalidate = 3600;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const currency = searchParams.get('currency') ?? 'USD';
  const startDate = searchParams.get('start');

  if (!startDate) {
    return NextResponse.json({ error: 'start parameter required' }, { status: 400 });
  }

  try {
    const [data, latest] = await Promise.all([
      getHistoricalRates('INR', currency, startDate),
      getLatestRates('INR', [currency]),
    ]);

    const history = Object.entries(data.rates)
      .map(([date, rates]) => ({
        date,
        rate: invertRate(rates[currency] ?? 0),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Append today's live rate if it's newer than the last historical point
    if (latest.rates[currency] != null) {
      const today = new Date().toISOString().split('T')[0];
      const lastDate = history[history.length - 1]?.date;
      if (!lastDate || today > lastDate) {
        history.push({ date: today, rate: invertRate(latest.rates[currency]) });
      }
    }

    return NextResponse.json({
      currency,
      base: 'INR',
      history,
    });
  } catch (error) {
    console.error('Currency history API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch currency history' },
      { status: 500 }
    );
  }
}
