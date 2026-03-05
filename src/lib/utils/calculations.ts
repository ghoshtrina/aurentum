export function invertRate(rate: number): number {
  if (rate === 0) return 0;
  return 1 / rate;
}

export function percentChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

export function ouncesToGrams(pricePerOunce: number): number {
  return pricePerOunce / 31.1035;
}

export function applyPurity(pricePerGram: number, purityMultiplier: number): number {
  return pricePerGram * purityMultiplier;
}

export function calculateMFReturn(currentNAV: number, pastNAV: number): number {
  if (pastNAV === 0) return 0;
  return ((currentNAV - pastNAV) / pastNAV) * 100;
}

export function getDateNDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

export function getDateForRange(range: string): string {
  const daysMap: Record<string, number> = {
    '1D': 1,
    '1W': 7,
    '1M': 30,
    '3M': 90,
    '6M': 180,
    '1Y': 365,
    '3Y': 1095,
    '5Y': 1825,
  };
  return getDateNDaysAgo(daysMap[range] ?? 30);
}
