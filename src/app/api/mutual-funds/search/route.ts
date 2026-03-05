import { NextRequest, NextResponse } from 'next/server';
import { searchSchemes, filterDirectGrowth } from '@/lib/api/mfapi';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');
  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const results = await searchSchemes(query);
    const filtered = filterDirectGrowth(results);
    return NextResponse.json(filtered.slice(0, 50));
  } catch (error) {
    console.error('MF search error:', error);
    return NextResponse.json([]);
  }
}
