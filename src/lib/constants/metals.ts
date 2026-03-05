export const GOLD_PURITIES = [
  { label: '24K (99.9%)', purity: '24K', multiplier: 1.0 },
  { label: '22K (91.6%)', purity: '22K', multiplier: 0.9166 },
  { label: '18K (75%)', purity: '18K', multiplier: 0.75 },
  { label: '14K (58.3%)', purity: '14K', multiplier: 0.583 },
  { label: '9K (37.5%)', purity: '9K', multiplier: 0.375 },
] as const;

export const SILVER_PURITIES = [
  { label: '999 Fine (99.9%)', purity: '999', multiplier: 1.0 },
  { label: '925 Sterling (92.5%)', purity: '925', multiplier: 0.925 },
] as const;

export const TROY_OUNCE_TO_GRAMS = 31.1035;
