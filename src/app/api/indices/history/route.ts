import { NextRequest, NextResponse } from 'next/server';
import { getIndexHistory } from '@/lib/api/indices';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const symbol = searchParams.get('symbol');
  const startDate = searchParams.get('start');

  if (!symbol || !startDate) {
    return NextResponse.json({ error: 'symbol and start parameters required' }, { status: 400 });
  }

  try {
    const history = await getIndexHistory(symbol, startDate);
    return NextResponse.json(
      { symbol, history },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
        },
      }
    );
  } catch (error) {
    console.error('Index history API error:', error);
    return NextResponse.json({ error: 'Failed to fetch index history' }, { status: 500 });
  }
}
