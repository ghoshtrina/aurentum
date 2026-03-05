'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { formatNumber } from '@/lib/utils/format';
import { ChangeIndicator } from '@/components/ui/ChangeIndicator';
import type { CurrencyRate } from '@/lib/types/currency';

interface CurrencyTableProps {
  rates: CurrencyRate[];
  onSelect: (code: string) => void;
  selectedCode: string;
}

export function CurrencyTable({ rates, onSelect, selectedCode }: CurrencyTableProps) {
  const [sortKey, setSortKey] = useState<'code' | 'inverseRate' | 'change1D'>('code');
  const [sortAsc, setSortAsc] = useState(true);

  const sorted = [...rates].sort((a, b) => {
    const aVal = a[sortKey] ?? 0;
    const bVal = b[sortKey] ?? 0;
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th
              className="cursor-pointer px-3 py-2 text-left font-medium text-muted-foreground"
              onClick={() => handleSort('code')}
            >
              Currency
            </th>
            <th
              className="cursor-pointer px-3 py-2 text-right font-medium text-muted-foreground"
              onClick={() => handleSort('inverseRate')}
            >
              INR
            </th>
            <th
              className="cursor-pointer px-3 py-2 text-right font-medium text-muted-foreground"
              onClick={() => handleSort('change1D')}
            >
              1D Change
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((rate) => (
            <tr
              key={rate.code}
              onClick={() => onSelect(rate.code)}
              className={cn(
                'cursor-pointer border-b border-border transition-colors hover:bg-muted/50',
                selectedCode === rate.code && 'bg-muted/80'
              )}
            >
              <td className="px-3 py-2">
                <span className="mr-2">{rate.flag}</span>
                <span className="font-medium">{rate.code}</span>
                <span className="ml-2 text-muted-foreground">{rate.name}</span>
              </td>
              <td className="px-3 py-2 text-right font-mono">
                {formatNumber(rate.inverseRate, 4)}
              </td>
              <td className="px-3 py-2 text-right">
                <ChangeIndicator value={rate.change1D} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
