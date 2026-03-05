import { NextRequest, NextResponse } from 'next/server';
import { getHistoricalRates } from '@/lib/api/frankfurter';
import { invertRate } from '@/lib/utils/calculations';

export const revalidate = 86400;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const currency = searchParams.get('currency') ?? 'USD';
  const startDate = searchParams.get('start');

  if (!startDate) {
    return NextResponse.json({ error: 'start parameter required' }, { status: 400 });
  }

  try {
    const data = await getHistoricalRates('INR', currency, startDate);

    const history = Object.entries(data.rates)
      .map(([date, rates]) => ({
        date,
        rate: invertRate(rates[currency] ?? 0),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

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
