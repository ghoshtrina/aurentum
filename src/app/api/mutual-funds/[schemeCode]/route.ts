import { NextResponse } from 'next/server';
import { getSchemeDetail } from '@/lib/api/mfapi';

export const revalidate = 3600;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ schemeCode: string }> }
) {
  const { schemeCode } = await params;
  const code = parseInt(schemeCode, 10);
  if (isNaN(code)) {
    return NextResponse.json({ error: 'Invalid scheme code' }, { status: 400 });
  }

  try {
    const detail = await getSchemeDetail(code);
    if (!detail) {
      return NextResponse.json({ error: 'Scheme not found' }, { status: 404 });
    }
    return NextResponse.json(detail);
  } catch (error) {
    console.error('MF detail error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scheme detail' },
      { status: 500 }
    );
  }
}
