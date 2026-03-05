'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CurrencyTable } from '@/components/currencies/CurrencyTable';
import { CurrencyConverter } from '@/components/currencies/CurrencyConverter';
import { Currency52Week } from '@/components/currencies/Currency52Week';
import { CurrencyChart } from '@/components/currencies/CurrencyChart';
import type { CurrencyRate } from '@/lib/types/currency';

interface CurrenciesClientProps {
  initialData: {
    date: string;
    base: string;
    rates: CurrencyRate[];
  } | null;
}

export function CurrenciesClient({ initialData }: CurrenciesClientProps) {
  const searchParams = useSearchParams();
  const paramCurrency = searchParams.get('selected');
  const [selectedCurrency, setSelectedCurrency] = useState(
    paramCurrency && initialData?.rates.some((r) => r.code === paramCurrency)
      ? paramCurrency
      : 'USD'
  );

  if (!initialData) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
        Unable to load currency data. Please try again later.
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-4">
      <div className="lg:col-span-3">
        <CurrencyTable
          rates={initialData.rates}
          onSelect={setSelectedCurrency}
          selectedCode={selectedCurrency}
        />
      </div>
      <div className="flex flex-col gap-6">
        <CurrencyConverter rates={initialData.rates} />
        <Currency52Week
          currencyCode={selectedCurrency}
          currentRate={initialData.rates.find((r) => r.code === selectedCurrency)?.inverseRate ?? 0}
        />
      </div>
      <div className="lg:col-span-4">
        <CurrencyChart currencyCode={selectedCurrency} />
      </div>
    </div>
  );
}
