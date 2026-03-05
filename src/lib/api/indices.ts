import { INDICES, OVERVIEW_INDICES } from '@/lib/constants/indices';

export interface IndexData {
  symbol: string;
  shortName: string;
  price: number;
  previousClose: number;
  change1D: number;
}

export interface IndexHistoryPoint {
  date: string;
  price: number;
}

const YAHOO_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
};

async function fetchIndex(symbol: string, shortName: string): Promise<IndexData | null> {
  try {
    const encoded = encodeURIComponent(symbol);
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encoded}?range=2d&interval=1d`;
    const res = await fetch(url, {
      headers: YAHOO_HEADERS,
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;

    const json = await res.json();
    const meta = json.chart?.result?.[0]?.meta;
    if (!meta) return null;

    const price = meta.regularMarketPrice ?? 0;
    const previousClose = meta.chartPreviousClose ?? 0;
    const change1D = previousClose > 0 ? ((price - previousClose) / previousClose) * 100 : 0;

    return { symbol, shortName, price, previousClose, change1D };
  } catch {
    return null;
  }
}

export async function getIndianIndices(): Promise<IndexData[]> {
  const overview = INDICES.filter((idx) => OVERVIEW_INDICES.includes(idx.symbol));
  const results = await Promise.all(
    overview.map((idx) => fetchIndex(idx.symbol, idx.shortName))
  );
  return results.filter((r): r is IndexData => r !== null);
}

export async function getAllIndices(): Promise<IndexData[]> {
  const results = await Promise.all(
    INDICES.map((idx) => fetchIndex(idx.symbol, idx.shortName))
  );
  return results.filter((r): r is IndexData => r !== null);
}

export async function getIndexHistory(
  symbol: string,
  startDate: string
): Promise<IndexHistoryPoint[]> {
  try {
    const encoded = encodeURIComponent(symbol);
    const period1 = Math.floor(new Date(startDate).getTime() / 1000);
    const period2 = Math.floor(Date.now() / 1000);
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encoded}?period1=${period1}&period2=${period2}&interval=1d`;

    const res = await fetch(url, {
      headers: YAHOO_HEADERS,
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [];

    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return [];

    const timestamps: number[] = result.timestamp ?? [];
    const closes: (number | null)[] = result.indicators?.quote?.[0]?.close ?? [];

    const points: IndexHistoryPoint[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const close = closes[i];
      if (close == null) continue;
      const d = new Date(timestamps[i] * 1000);
      const date = d.toISOString().split('T')[0];
      points.push({ date, price: close });
    }

    return points;
  } catch (error) {
    console.error('Index history fetch failed:', error instanceof Error ? error.message : error);
    return [];
  }
}
