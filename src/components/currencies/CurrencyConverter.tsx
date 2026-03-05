'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { formatNumber } from '@/lib/utils/format';
import type { CurrencyRate } from '@/lib/types/currency';

interface CurrencyConverterProps {
  rates: CurrencyRate[];
}

export function CurrencyConverter({ rates }: CurrencyConverterProps) {
  const [amount, setAmount] = useState('1');
  const [fromINR, setFromINR] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');

  const rate = rates.find((r) => r.code === selectedCurrency);
  const numAmount = parseFloat(amount) || 0;

  const converted = rate
    ? fromINR
      ? numAmount * rate.ratePerINR
      : numAmount * rate.inverseRate
    : 0;

  const topLabel = fromINR ? 'INR' : selectedCurrency;
  const bottomLabel = fromINR ? selectedCurrency : 'INR';

  return (
    <Card className="p-4">
      <h3 className="mb-3 text-sm font-medium text-muted-foreground">Currency Converter</h3>
      <div className="flex flex-col gap-3">
        {/* Currency selector */}
        <select
          value={selectedCurrency}
          onChange={(e) => setSelectedCurrency(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none"
        >
          {rates.map((r) => (
            <option key={r.code} value={r.code}>
              {r.flag} {r.code} — {r.name}
            </option>
          ))}
        </select>

        {/* Input amount + source currency label */}
        <div className="flex gap-2">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="Amount"
          />
          <span className="flex items-center rounded-lg bg-muted px-3 py-2 text-sm font-medium">
            {topLabel}
          </span>
        </div>

        {/* Swap button */}
        <button
          onClick={() => setFromINR(!fromINR)}
          className="self-center rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Swap currencies"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path fillRule="evenodd" d="M2.24 6.8a.75.75 0 001.06-.04l1.95-2.1v8.59a.75.75 0 001.5 0V4.66l1.95 2.1a.75.75 0 101.1-1.02l-3.25-3.5a.75.75 0 00-1.1 0L2.2 5.74a.75.75 0 00.04 1.06zm8 6.4a.75.75 0 00-.04 1.06l3.25 3.5a.75.75 0 001.1 0l3.25-3.5a.75.75 0 10-1.1-1.02l-1.95 2.1V6.75a.75.75 0 00-1.5 0v8.59l-1.95-2.1a.75.75 0 00-1.06-.04z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Result + target currency label */}
        <div className="flex gap-2">
          <div className="flex-1 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm font-mono">
            {formatNumber(converted, 4)}
          </div>
          <span className="flex items-center rounded-lg bg-muted px-3 py-2 text-sm font-medium">
            {bottomLabel}
          </span>
        </div>
      </div>
    </Card>
  );
}
