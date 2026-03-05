import { AED_USD_PEG_FALLBACK } from '@/lib/constants/currencies';

const FRANKFURTER_URL = 'https://api.frankfurter.dev';
const OPEN_XR_URL = 'https://openexchangerates.org/api/latest.json';
const OPEN_ER_URL = 'https://open.er-api.com/v6/latest';

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

// ---------------------------------------------------------------------------
// Latest rates — cascading: Open Exchange Rates → open.er-api.com → Frankfurter
// ---------------------------------------------------------------------------

export async function getLatestRates(
  base = 'INR',
  symbols?: string[]
): Promise<FrankfurterLatestResponse> {
  // 1. Open Exchange Rates (hourly, needs key)
  try {
    return await getLatestFromOpenXR(base, symbols);
  } catch (e) {
    console.warn('Open Exchange Rates failed:', e);
  }

  // 2. open.er-api.com (daily, no key)
  try {
    return await getLatestFromOpenER(base, symbols);
  } catch (e) {
    console.warn('open.er-api.com failed:', e);
  }

  // 3. Frankfurter (daily, no key)
  return getLatestFromFrankfurter(base, symbols);
}

// ---------------------------------------------------------------------------
// 1. Open Exchange Rates (hourly updates, free tier = USD base only)
//    We fetch USD-based rates and convert to requested base via cross-rates.
// ---------------------------------------------------------------------------

async function getLatestFromOpenXR(
  base: string,
  symbols?: string[]
): Promise<FrankfurterLatestResponse> {
  const appId = process.env.OPEN_EXCHANGE_RATES_APP_ID;
  if (!appId) throw new Error('OPEN_EXCHANGE_RATES_APP_ID not set');

  const res = await fetch(`${OPEN_XR_URL}?app_id=${appId}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Open Exchange Rates: ${res.status}`);
  const data = await res.json();
  if (!data.rates) throw new Error('Open Exchange Rates: no rates in response');

  // Convert from USD base to requested base via cross-rates
  const baseRateInUSD = data.rates[base];
  if (!baseRateInUSD) throw new Error(`Open Exchange Rates: no rate for base ${base}`);

  const rates: Record<string, number> = {};
  const targetSymbols = symbols ?? Object.keys(data.rates);
  for (const sym of targetSymbols) {
    if (sym === base) continue;
    if (data.rates[sym] != null) {
      // Cross-rate: 1 BASE = (sym/USD) / (base/USD)
      rates[sym] = data.rates[sym] / baseRateInUSD;
    }
  }

  // AED fallback from USD peg if missing
  if (symbols?.includes('AED') && rates['AED'] == null && data.rates['USD'] != null) {
    rates['AED'] = (data.rates['USD'] * AED_USD_PEG_FALLBACK) / baseRateInUSD;
  }

  return {
    amount: 1,
    base,
    date: data.timestamp
      ? new Date(data.timestamp * 1000).toISOString()
      : new Date().toISOString(),
    rates,
  };
}

// ---------------------------------------------------------------------------
// 2. open.er-api.com (daily, no key, supports any base)
// ---------------------------------------------------------------------------

async function getLatestFromOpenER(
  base: string,
  symbols?: string[]
): Promise<FrankfurterLatestResponse> {
  const res = await fetch(`${OPEN_ER_URL}/${base}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`ExchangeRate API: ${res.status}`);
  const data = await res.json();
  if (data.result !== 'success' || !data.rates) {
    throw new Error('ExchangeRate API returned unsuccessful result');
  }

  const rates: Record<string, number> = {};
  if (symbols?.length) {
    for (const sym of symbols) {
      if (data.rates[sym] != null) {
        rates[sym] = data.rates[sym];
      }
    }
  } else {
    Object.assign(rates, data.rates);
  }

  // AED fallback from USD peg if missing
  if (symbols?.includes('AED') && rates['AED'] == null && rates['USD'] != null) {
    rates['AED'] = rates['USD'] * AED_USD_PEG_FALLBACK;
  }

  return {
    amount: 1,
    base,
    date: data.time_last_update_utc
      ? new Date(data.time_last_update_utc).toISOString()
      : new Date().toISOString(),
    rates,
  };
}

// ---------------------------------------------------------------------------
// 3. Frankfurter (daily, no key, ECB data)
// ---------------------------------------------------------------------------

function stripAED(symbols?: string[]): string[] | undefined {
  return symbols?.filter((s) => s !== 'AED');
}

async function injectAED(
  rates: Record<string, number>,
  base: string
): Promise<void> {
  // Try live rate from open.er-api.com
  try {
    const res = await fetch(`${OPEN_ER_URL}/${base}`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.result === 'success' && data.rates?.AED != null) {
        rates['AED'] = data.rates.AED;
        return;
      }
    }
  } catch {
    // fall through to USD peg
  }
  if (rates['USD'] != null) {
    rates['AED'] = rates['USD'] * AED_USD_PEG_FALLBACK;
  }
}

async function getLatestFromFrankfurter(
  base: string,
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
  const res = await fetch(`${FRANKFURTER_URL}/v1/latest?${params}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Frankfurter API error: ${res.status}`);
  const data: FrankfurterLatestResponse = await res.json();
  if (needsAED) await injectAED(data.rates, base);

  // Frankfurter returns date-only (e.g. "2026-03-03"). ECB publishes ~16:00 CET = 20:30 IST.
  if (data.date && !data.date.includes('T')) {
    data.date = new Date(data.date + 'T20:30:00+05:30').toISOString();
  }

  return data;
}

// ---------------------------------------------------------------------------
// Historical rates — Frankfurter only (time-series endpoint)
// ---------------------------------------------------------------------------

export async function getHistoricalRates(
  base: string,
  target: string,
  startDate: string,
  endDate?: string
): Promise<FrankfurterTimeSeriesResponse> {
  const end = endDate ?? new Date().toISOString().split('T')[0];
  const apiTarget = target === 'AED' ? 'USD' : target;
  const res = await fetch(
    `${FRANKFURTER_URL}/v1/${startDate}..${end}?base=${base}&symbols=${apiTarget}`,
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

// ---------------------------------------------------------------------------
// Yesterday rates — Frankfurter time-series (previous trading day)
// ---------------------------------------------------------------------------

export async function getYesterdayRates(
  base = 'INR',
  symbols?: string[]
): Promise<FrankfurterLatestResponse> {
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
    `${FRANKFURTER_URL}/v1/${startStr}..${endStr}?${params}`,
    { next: { revalidate: 3600 } }
  );
  if (!res.ok) throw new Error(`Frankfurter API error: ${res.status}`);
  const data: FrankfurterTimeSeriesResponse = await res.json();

  const tradingDates = Object.keys(data.rates).sort();
  const prevDate =
    tradingDates.length >= 2
      ? tradingDates[tradingDates.length - 2]
      : tradingDates[0];

  const prevRates = data.rates[prevDate] ?? {};

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
