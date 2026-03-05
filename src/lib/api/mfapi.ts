import { getNavRevalidate } from '@/lib/utils/market-hours';

const BASE_URL = 'https://api.mfapi.in';

export interface MFSchemeBasic {
  schemeCode: number;
  schemeName: string;
}

export interface MFSchemeDetail {
  meta: {
    fund_house: string;
    scheme_type: string;
    scheme_category: string;
    scheme_code: number;
    scheme_name: string;
  };
  data: Array<{
    date: string;
    nav: string;
  }>;
}

export async function searchSchemes(query: string): Promise<MFSchemeBasic[]> {
  try {
    const res = await fetch(`${BASE_URL}/mf/search?q=${encodeURIComponent(query)}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data;
  } catch {
    return [];
  }
}

export async function getAllSchemes(): Promise<MFSchemeBasic[]> {
  try {
    const res = await fetch(`${BASE_URL}/mf`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data;
  } catch {
    return [];
  }
}

export async function getSchemeDetail(schemeCode: number): Promise<MFSchemeDetail | null> {
  try {
    const res = await fetch(`${BASE_URL}/mf/${schemeCode}`, {
      next: { revalidate: getNavRevalidate() },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.meta?.scheme_code || !Array.isArray(data?.data)) return null;
    return data as MFSchemeDetail;
  } catch {
    return null;
  }
}

export function filterDirectGrowth(schemes: MFSchemeBasic[]): MFSchemeBasic[] {
  return schemes.filter((s) => {
    const name = s.schemeName.toLowerCase();
    return name.includes('direct') && (name.includes('growth') || name.includes('gr'));
  });
}

export interface ClassifiedScheme extends MFSchemeBasic {
  category: string;
  subCategory: string;
}
