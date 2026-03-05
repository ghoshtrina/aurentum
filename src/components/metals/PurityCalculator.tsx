'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils/format';
import { GOLD_PURITIES, SILVER_PURITIES } from '@/lib/constants/metals';

interface PurityCalculatorProps {
  gold24kPerGram: number;
  silver999PerGram: number;
}

export function PurityCalculator({ gold24kPerGram, silver999PerGram }: PurityCalculatorProps) {
  const [metal, setMetal] = useState<'gold' | 'silver'>('gold');
  const [weight, setWeight] = useState('10');
  const [unit, setUnit] = useState<'g' | 'oz'>('g');
  const [purityIndex, setPurityIndex] = useState(0);

  const purities = metal === 'gold' ? GOLD_PURITIES : SILVER_PURITIES;
  const basePrice = metal === 'gold' ? gold24kPerGram : silver999PerGram;
  const purity = purities[purityIndex] ?? purities[0];

  const weightInGrams = unit === 'oz' ? parseFloat(weight || '0') * 31.1035 : parseFloat(weight || '0');
  const totalPrice = weightInGrams * basePrice * purity.multiplier;

  return (
    <Card>
      <h3 className="mb-4 text-sm font-medium text-muted-foreground">Purity Calculator</h3>
      <div className="flex flex-col gap-3">
        {/* Metal select */}
        <div className="flex gap-2">
          <button
            onClick={() => { setMetal('gold'); setPurityIndex(0); }}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              metal === 'gold' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            Gold
          </button>
          <button
            onClick={() => { setMetal('silver'); setPurityIndex(0); }}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              metal === 'silver' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            Silver
          </button>
        </div>

        {/* Weight input */}
        <div className="flex gap-2">
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            placeholder="Weight"
            min="0"
            step="0.1"
          />
          <div className="grid w-24 grid-cols-2 overflow-hidden rounded-lg border border-border">
            <button
              onClick={() => setUnit('g')}
              className={`flex items-center justify-center py-2 text-sm ${unit === 'g' ? 'bg-muted font-medium' : 'text-muted-foreground'}`}
            >
              g
            </button>
            <button
              onClick={() => setUnit('oz')}
              className={`flex items-center justify-center py-2 text-sm ${unit === 'oz' ? 'bg-muted font-medium' : 'text-muted-foreground'}`}
            >
              oz
            </button>
          </div>
        </div>

        {/* Purity select */}
        <select
          value={purityIndex}
          onChange={(e) => setPurityIndex(Number(e.target.value))}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none"
        >
          {purities.map((p, i) => (
            <option key={p.label} value={i}>
              {p.label}
            </option>
          ))}
        </select>

        {/* Result */}
        <div className="rounded-lg bg-muted/50 p-4 text-center">
          <p className="text-xs text-muted-foreground">Estimated value</p>
          <p className="mt-1 text-2xl font-bold text-accent">
            {basePrice > 0 ? formatCurrency(totalPrice) : '--'}
          </p>
        </div>
      </div>
    </Card>
  );
}
