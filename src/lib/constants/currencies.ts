export const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', flag: '🇨🇭' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
] as const;

// AED is not supported by Frankfurter (ECB). We fetch it from ExchangeRate API.
// Fallback: AED is pegged to USD at 3.6725 (UAE Central Bank, since 1997).
export const AED_USD_PEG_FALLBACK = 3.6725;

export const DASHBOARD_CURRENCIES = ['USD', 'GBP', 'EUR', 'AUD', 'AED'] as const;

export function getCurrencyInfo(code: string) {
  return CURRENCIES.find((c) => c.code === code);
}
