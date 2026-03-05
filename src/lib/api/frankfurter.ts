import { AED_USD_PEG_FALLBACK } from '@/lib/constants/currencies';

const BASE_URL = 'https://api.frankfurter.dev';

export interface FrankfurterLatestResponse {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

export interface FrankfurterTimeSeriesResponse {
  amount: number;
  base: string;
  start_date: string;
  end_date: string;
  rates: Record<string, Record<string, number>>;
}

// Fetch live AED/INR rate from ExchangeRate API (free, no key).
// Falls back to deriving from USD using the fixed peg if API is unavailable.
async function fetchAEDRate(base: string): Promise<number> {
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${base}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`ExchangeRate API: ${res.status}`);
    const data = await res.json();
    if (data.result === 'success' && data.rates?.AED != null) {
      return data.rates.AED;
    }
  } catch (error) {
    console.error('ExchangeRate API failed, using USD peg fallback:', error);
  }
  return 0; // Will be derived from USD peg below
}

function stripAED(symbols?: string[]): string[] | undefined {
  return symbols?.filter((s) => s !== 'AED');
}

async function injectAED(
  rates: Record<string, number>,
  base: string
): Promise<void> {
  // Try live rate first
  const liveRate = await fetchAEDRate(base);
  if (liveRate > 0) {
    rates['AED'] = liveRate;
  } else if (rates['USD'] != null) {
    // Fallback: derive from USD peg
    rates['AED'] = rates['USD'] * AED_USD_PEG_FALLBACK;
  }
}

export async function getLatestRates(
  base = 'INR',
  symbols?: string[]
): Promise<FrankfurterLatestResponse> {
  const needsAED = symbols?.includes('AED');
  const apiSymbols = stripAED(symbols);
  if (needsAED && apiSymbols && !apiSymbols.includes('USD')) {
    apiSymbols.push('USD');
  }
  const params = new URLSearchParams({ base });
  if (apiSymbols?.length) {
    params.set('symbols', apiSymbols.join(','));
  }
  const res = await fetch(`${BASE_URL}/v1/latest?${params}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Frankfurter API error: ${res.status}`);
  const data: FrankfurterLatestResponse = await res.json();
  if (needsAED) await injectAED(data.rates, base);
  return data;
}

export async function getHistoricalRates(
  base: string,
  target: string,
  startDate: string,
  endDate?: string
): Promise<FrankfurterTimeSeriesResponse> {
  const end = endDate ?? new Date().toISOString().split('T')[0];
  const apiTarget = target === 'AED' ? 'USD' : target;
  const res = await fetch(
    `${BASE_URL}/v1/${startDate}..${end}?base=${base}&symbols=${apiTarget}`,
    { next: { revalidate: 86400 } }
  );
  if (!res.ok) throw new Error(`Frankfurter API error: ${res.status}`);
  const data: FrankfurterTimeSeriesResponse = await res.json();

  // Convert USD historical rates to AED
  if (target === 'AED') {
    for (const dateKey of Object.keys(data.rates)) {
      const dayRates = data.rates[dateKey];
      if (dayRates['USD'] != null) {
        dayRates['AED'] = dayRates['USD'] * AED_USD_PEG_FALLBACK;
        delete dayRates['USD'];
      }
    }
  }

  return data;
}

export async function getYesterdayRates(
  base = 'INR',
  symbols?: string[]
): Promise<FrankfurterLatestResponse> {
  // Fetch last 10 days as timeseries to find the previous trading day
  // (Frankfurter only has data for trading days — weekends/holidays are skipped)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 10);
  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  const needsAED = symbols?.includes('AED');
  const apiSymbols = stripAED(symbols);
  if (needsAED && apiSymbols && !apiSymbols.includes('USD')) {
    apiSymbols.push('USD');
  }
  const params = new URLSearchParams({ base });
  if (apiSymbols?.length) {
    params.set('symbols', apiSymbols.join(','));
  }
  const res = await fetch(
    `${BASE_URL}/v1/${startStr}..${endStr}?${params}`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) throw new Error(`Frankfurter API error: ${res.status}`);
  const data: FrankfurterTimeSeriesResponse = await res.json();

  // Get sorted trading dates and pick the second-to-last one
  const tradingDates = Object.keys(data.rates).sort();
  // Use second-to-last date (previous trading day); fall back to earliest if only one
  const prevDate =
    tradingDates.length >= 2
      ? tradingDates[tradingDates.length - 2]
      : tradingDates[0];

  const prevRates = data.rates[prevDate] ?? {};

  // Build a FrankfurterLatestResponse-compatible result
  const result: FrankfurterLatestResponse = {
    amount: data.amount,
    base: data.base,
    date: prevDate,
    rates: { ...prevRates },
  };

  if (needsAED && result.rates['USD'] != null) {
    result.rates['AED'] = result.rates['USD'] * AED_USD_PEG_FALLBACK;
  }
  return result;
}
