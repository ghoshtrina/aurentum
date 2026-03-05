export interface MetalPrice {
  metal: 'gold' | 'silver';
  pricePerGram: number;
  currency: string;
  change1D?: number;
  lastUpdated: string;
  source: string;
}

export interface MetalPurity {
  label: string;
  multiplier: number;
  pricePerGram: number;
}

export interface MetalHistoryPoint {
  date: string;
  price: number;
}
