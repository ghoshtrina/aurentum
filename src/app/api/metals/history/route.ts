import { NextRequest, NextResponse } from 'next/server';
import { getMetalHistory } from '@/lib/api/metals';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const metal = (searchParams.get('metal') ?? 'gold') as 'gold' | 'silver';
  const startDate = searchParams.get('start');

  if (!startDate) {
    return NextResponse.json({ error: 'start parameter required' }, { status: 400 });
  }

  try {
    const history = await getMetalHistory(metal, startDate);
    return NextResponse.json(
      { metal, history },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
        },
      }
    );
  } catch (error) {
    console.error('Metals history API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metal history' },
      { status: 500 }
    );
  }
}
