export interface IndexInfo {
  symbol: string;
  shortName: string;
  category: string;
  currency: 'INR' | 'USD';
}

export const INDICES: IndexInfo[] = [
  // Core
  { symbol: '^NSEI', shortName: 'NIFTY 50', category: 'Core', currency: 'INR' },
  { symbol: '^NSMIDCP', shortName: 'NIFTY Next 50', category: 'Core', currency: 'INR' },
  { symbol: '^CNX100', shortName: 'NIFTY 100', category: 'Core', currency: 'INR' },
  { symbol: '^CRSLDX', shortName: 'NIFTY 500', category: 'Core', currency: 'INR' },
  { symbol: '^BSESN', shortName: 'SENSEX', category: 'Core', currency: 'INR' },
  // Market Cap
  { symbol: 'NIFTYMIDCAP150.NS', shortName: 'NIFTY Midcap 150', category: 'Market Cap', currency: 'INR' },
  { symbol: 'NIFTY_SMLCAP_250.NS', shortName: 'NIFTY Smallcap 250', category: 'Market Cap', currency: 'INR' },
  // Popular Sector
  { symbol: '^NSEBANK', shortName: 'NIFTY Bank', category: 'Popular Sector', currency: 'INR' },
  { symbol: '^CNXIT', shortName: 'NIFTY IT', category: 'Popular Sector', currency: 'INR' },
  // International
  { symbol: '^NDX', shortName: 'NASDAQ 100', category: 'International', currency: 'USD' },
  { symbol: '^GSPC', shortName: 'S&P 500', category: 'International', currency: 'USD' },
];

export const INDEX_CATEGORIES = ['Core', 'Market Cap', 'Popular Sector', 'International'];

export const OVERVIEW_INDICES = ['^BSESN', '^NSEI', '^NSEBANK', '^CNXIT'];

export function getIndexBySymbol(symbol: string): IndexInfo | undefined {
  return INDICES.find((idx) => idx.symbol === symbol);
}
