export interface CurrencyRate {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  ratePerINR: number;
  inverseRate: number;
  change1D?: number;
}

export interface CurrencyHistoryPoint {
  date: string;
  rate: number;
}

export interface CurrencyLatestResponse {
  base: string;
  date: string;
  rates: Record<string, number>;
}
