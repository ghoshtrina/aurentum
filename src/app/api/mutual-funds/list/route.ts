import { NextResponse } from 'next/server';
import { getAllSchemes, filterDirectGrowth } from '@/lib/api/mfapi';
import { classifyFund } from '@/lib/constants/mf-categories';

export const revalidate = 86400;

export async function GET() {
  try {
    const all = await getAllSchemes();
    const directGrowth = filterDirectGrowth(all);

    const categorized = directGrowth.map((scheme) => {
      const { category, subCategory } = classifyFund(scheme.schemeName);
      return { ...scheme, category, subCategory };
    });

    return NextResponse.json(categorized);
  } catch (error) {
    console.error('MF list error:', error);
    return NextResponse.json([]);
  }
}
