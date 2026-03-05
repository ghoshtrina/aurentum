export interface MetalPricesResult {
  gold24kPerGram: number;
  gold22kPerGram: number;
  gold18kPerGram: number;
  gold14kPerGram: number;
  gold9kPerGram: number;
  silver999PerGram: number;
  silver925PerGram: number;
  goldChange1D?: number;
  silverChange1D?: number;
  source: string;
  lastUpdated: string;
  isEstimated: boolean;
  marketClosed: boolean;
}

// ============================================================
// Source 1 (Primary): IBJA - India Bullion & Jewellers Association
// ibjarates.com - official daily gold & silver rates.
// Gold is per 10g, Silver is per kg. Excludes 3% GST.
// ============================================================

interface IBJARates {
  date: string;
  gold999Per10g: number;
  gold916Per10g: number;
  gold750Per10g: number;
  silver999PerKg: number;
}

async function fetchIBJARates(): Promise<IBJARates[] | null> {
  try {
    const res = await fetch('https://ibjarates.com/', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;

    const html = await res.text();
    const clean = html.replace(/\s+/g, ' ');

    // Row pattern: date, Gold 999, 995, 916, 750, 585, Silver 999, Silver old
    // PM rows have the latest closing rates; AM rows are the morning opening rates.
    // Prefer PM (more recent) with AM as fallback if PM hasn't been published yet.
    const makePattern = (label: string) =>
      new RegExp(
        `data-label="${label}"[^>]*>\\s*<strong>(\\d{2}\\/\\d{2}\\/\\d{4})<\\/strong>\\s*<\\/td>\\s*<td[^>]*>(\\d+)\\s*<\\/td>\\s*<td[^>]*>(\\d+)\\s*<\\/td>\\s*<td[^>]*>(\\d+)\\s*<\\/td>\\s*<td[^>]*>(\\d+)\\s*<\\/td>\\s*<td[^>]*>(\\d+)\\s*<\\/td>\\s*<td[^>]*>(\\d+)\\s*<\\/td>\\s*<td[^>]*>(\\d+)\\s*<\\/td>`,
        'g'
      );

    const parseRows = (pattern: RegExp) => {
      const result: IBJARates[] = [];
      let match;
      while ((match = pattern.exec(clean)) !== null) {
        result.push({
          date: match[1],
          gold999Per10g: parseInt(match[2]),
          gold916Per10g: parseInt(match[4]),
          gold750Per10g: parseInt(match[5]),
          silver999PerKg: parseInt(match[7]),
        });
      }
      return result;
    };

    const pmRows = parseRows(makePattern('PM'));
    const amRows = parseRows(makePattern('AM'));
    const rows = pmRows.length > 0 ? pmRows : amRows;

    return rows.length > 0 ? rows : null;
  } catch (error) {
    console.error('IBJA fetch failed:', error);
    return null;
  }
}

// ============================================================
// Source 2 (Fallback): Groww.in MCX spot prices
// MCX gold is per 10g, MCX silver is per kg. Close to IBJA rates
// during market hours. City-wise rates are NOT used (they include
// GST + state taxes + making charges = 10-15% inflated).
// ============================================================

interface GrowwMCXResult {
  goldPer10g: number | null;
  goldPrevClose: number | null;
  silverPerKg: number | null;
  silverPrevClose: number | null;
}

async function fetchGrowwMCX(): Promise<GrowwMCXResult | null> {
  try {
    const [goldRes, silverRes] = await Promise.all([
      fetch('https://groww.in/gold-rates', {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        next: { revalidate: 300 },
      }),
      fetch('https://groww.in/silver-rates', {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        next: { revalidate: 300 },
      }),
    ]);

    if (!goldRes.ok && !silverRes.ok) return null;

    let goldPer10g: number | null = null;
    let goldPrevClose: number | null = null;
    let silverPerKg: number | null = null;
    let silverPrevClose: number | null = null;

    if (goldRes.ok) {
      const html = await goldRes.text();
      const match = html.match(/__NEXT_DATA__.*?>(.*?)<\/script>/);
      if (match) {
        const data = JSON.parse(match[1]);
        // MCX spot data — check both current and legacy paths
        const mcx = data.props?.pageProps?.goldMCXData
          ?? data.props?.pageProps?.goldRateData?.goldMCXData;
        if (mcx?.spotPrice) {
          goldPer10g = mcx.spotPrice;
          goldPrevClose = mcx.lastDayClosePrice ?? null;
        }
      }
    }

    if (silverRes.ok) {
      const html = await silverRes.text();
      const match = html.match(/__NEXT_DATA__.*?>(.*?)<\/script>/);
      if (match) {
        const data = JSON.parse(match[1]);
        const item = data.props?.pageProps?.silverItem;
        if (item?.spotPrice) {
          silverPerKg = item.spotPrice;
          silverPrevClose = item.lastDayClosePrice ?? null;
        }
      }
    }

    if (!goldPer10g && !silverPerKg) return null;

    return { goldPer10g, goldPrevClose, silverPerKg, silverPrevClose };
  } catch (error) {
    console.error('Groww MCX fetch failed:', error);
    return null;
  }
}

// ============================================================
// Source 3 (Last resort): Gold API - international spot prices
// Requires GOLD_API_KEY. Prices are international spot in INR,
// typically 5-10% lower than Indian domestic rates.
// ============================================================

interface GoldApiResponse {
  price_gram_24k: number;
  price_gram_22k: number;
  price_gram_18k: number;
  chp: number;
}

async function fetchGoldApi(
  symbol: 'XAU' | 'XAG'
): Promise<GoldApiResponse | null> {
  try {
    const apiKey = process.env.GOLD_API_KEY;
    if (!apiKey) return null;

    const res = await fetch(`https://www.goldapi.io/api/${symbol}/INR`, {
      headers: { 'x-access-token': apiKey },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ============================================================
// Main function: cascading fallback
// ============================================================

function isIBJADateToday(ibjaDate: string): boolean {
  // IBJA date format: DD/MM/YYYY
  const parts = ibjaDate.split('/');
  if (parts.length !== 3) return false;
  const today = new Date();
  const todayStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
  return ibjaDate === todayStr;
}

function buildIBJAResult(ibjaRows: IBJARates[], marketClosed: boolean): MetalPricesResult {
  const latest = ibjaRows[0];
  const previous = ibjaRows.length > 1 ? ibjaRows[1] : null;

  const gold999PerGram = latest.gold999Per10g / 10;
  const gold916PerGram = latest.gold916Per10g / 10;
  const gold750PerGram = latest.gold750Per10g / 10;
  const silver999PerGram = latest.silver999PerKg / 1000;

  let goldChange1D: number | undefined;
  let silverChange1D: number | undefined;
  if (previous) {
    const prevGold = previous.gold999Per10g / 10;
    const prevSilver = previous.silver999PerKg / 1000;
    if (prevGold > 0)
      goldChange1D = ((gold999PerGram - prevGold) / prevGold) * 100;
    if (prevSilver > 0)
      silverChange1D =
        ((silver999PerGram - prevSilver) / prevSilver) * 100;
  }

  return {
    gold24kPerGram: gold999PerGram,
    gold22kPerGram: gold916PerGram,
    gold18kPerGram: gold750PerGram,
    gold14kPerGram: gold999PerGram * 0.583,
    gold9kPerGram: gold999PerGram * 0.375,
    silver999PerGram,
    silver925PerGram: silver999PerGram * 0.925,
    goldChange1D,
    silverChange1D,
    source: 'IBJA (India Bullion & Jewellers Assoc.)',
    lastUpdated: latest.date,
    isEstimated: false,
    marketClosed,
  };
}

export async function getMetalPrices(): Promise<MetalPricesResult> {
  // --- Try IBJA first ---
  const ibjaRows = await fetchIBJARates();

  if (ibjaRows && ibjaRows.length > 0) {
    // If IBJA has today's data, use it directly (market is open)
    if (isIBJADateToday(ibjaRows[0].date)) {
      return buildIBJAResult(ibjaRows, false);
    }
    // IBJA data is stale (holiday/weekend) — try fallbacks for fresher prices,
    // but keep IBJA as the final fallback if all else fails.
  }

  // --- Fallback: Groww MCX ---
  const groww = await fetchGrowwMCX();

  if (groww && groww.goldPer10g) {
    const gold999PerGram = groww.goldPer10g / 10;
    const silver999PerGram = groww.silverPerKg
      ? groww.silverPerKg / 1000
      : 0;

    let goldChange1D: number | undefined;
    let silverChange1D: number | undefined;
    if (groww.goldPrevClose && groww.goldPrevClose > 0) {
      goldChange1D =
        ((groww.goldPer10g - groww.goldPrevClose) / groww.goldPrevClose) * 100;
    }
    if (groww.silverPerKg && groww.silverPrevClose && groww.silverPrevClose > 0) {
      silverChange1D =
        ((groww.silverPerKg - groww.silverPrevClose) / groww.silverPrevClose) *
        100;
    }

    return {
      gold24kPerGram: gold999PerGram,
      gold22kPerGram: gold999PerGram * 0.9166,
      gold18kPerGram: gold999PerGram * 0.75,
      gold14kPerGram: gold999PerGram * 0.583,
      gold9kPerGram: gold999PerGram * 0.375,
      silver999PerGram,
      silver925PerGram: silver999PerGram * 0.925,
      goldChange1D,
      silverChange1D,
      source: 'Groww MCX spot',
      lastUpdated: new Date().toISOString(),
      isEstimated: false,
      marketClosed: ibjaRows !== null,
    };
  }

  // --- Last resort: Gold API (international spot) ---
  const [goldData, silverData] = await Promise.all([
    fetchGoldApi('XAU'),
    fetchGoldApi('XAG'),
  ]);

  if (goldData) {
    const silver999 = silverData?.price_gram_24k ?? 0;
    return {
      gold24kPerGram: goldData.price_gram_24k,
      gold22kPerGram: goldData.price_gram_22k,
      gold18kPerGram: goldData.price_gram_18k,
      gold14kPerGram: goldData.price_gram_24k * 0.583,
      gold9kPerGram: goldData.price_gram_24k * 0.375,
      silver999PerGram: silver999,
      silver925PerGram: silver999 * 0.925,
      goldChange1D: goldData.chp,
      silverChange1D: silverData?.chp,
      source: 'GoldAPI.io (international spot)',
      lastUpdated: new Date().toISOString(),
      isEstimated: true,
      marketClosed: ibjaRows !== null,
    };
  }

  // --- All live sources failed; use stale IBJA data if available ---
  if (ibjaRows && ibjaRows.length > 0) {
    return buildIBJAResult(ibjaRows, true);
  }

  return {
    gold24kPerGram: 0,
    gold22kPerGram: 0,
    gold18kPerGram: 0,
    gold14kPerGram: 0,
    gold9kPerGram: 0,
    silver999PerGram: 0,
    silver925PerGram: 0,
    source: 'unavailable',
    lastUpdated: new Date().toISOString(),
    isEstimated: true,
    marketClosed: false,
  };
}

// ============================================================
// Historical prices (for charts) - Yahoo Finance ETFs
// GOLDBEES.NS (gold) and SILVERBEES.NS (silver) on NSE India.
// ETF prices track domestic gold/silver closely in INR.
// ============================================================

export interface MetalHistoryPoint {
  date: string;
  price: number;
}

export async function getMetalHistory(
  metal: 'gold' | 'silver',
  startDate: string
): Promise<MetalHistoryPoint[]> {
  try {
    const symbol = metal === 'gold' ? 'GOLDBEES.NS' : 'SILVERBEES.NS';
    const period1 = Math.floor(new Date(startDate).getTime() / 1000);
    const period2 = Math.floor(Date.now() / 1000);
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${period1}&period2=${period2}&interval=1d`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [];

    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return [];

    const timestamps: number[] = result.timestamp ?? [];
    const closes: (number | null)[] = result.indicators?.quote?.[0]?.close ?? [];

    const points: MetalHistoryPoint[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const close = closes[i];
      if (close == null) continue;
      const d = new Date(timestamps[i] * 1000);
      const date = d.toISOString().split('T')[0];
      points.push({ date, price: close });
    }

    return points;
  } catch (error) {
    console.error('Metal history fetch failed:', error instanceof Error ? error.message : error);
    return [];
  }
}
