import { NextResponse } from 'next/server';
import { getMetalPrices } from '@/lib/api/metals';

export const revalidate = 300;

export async function GET() {
  try {
    const prices = await getMetalPrices();
    return NextResponse.json(prices);
  } catch (error) {
    console.error('Metals latest API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metal prices' },
      { status: 500 }
    );
  }
}
