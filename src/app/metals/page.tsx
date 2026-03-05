import { getMetalPrices } from '@/lib/api/metals';
import { MetalsClient } from './MetalsClient';
import { PageTimestamp } from '@/components/ui/PageTimestamp';

export const metadata = {
  title: 'Precious Metals - Aurentum',
  description: 'Gold and silver prices per gram in INR with purity calculator',
};

export const revalidate = 300;

export default async function MetalsPage() {
  const prices = await getMetalPrices();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Precious Metals</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gold &amp; silver prices in INR per gram
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {prices.source.startsWith('Groww') ? (
            <>
              Metal prices from{' '}
              <a href="https://groww.in/gold-rates" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">Groww</a>.
              {' '}Prices exclude GST, local and state taxes, and jeweller markups.
            </>
          ) : prices.source.startsWith('GoldAPI') ? (
            <>
              Metal prices from{' '}
              <a href="https://www.goldapi.io/" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">Gold API</a>.
              {' '}Prices are international spot prices and exclude GST, import duties, jeweller markups etc.
            </>
          ) : (
            <>
              Metal prices from{' '}
              <a href="https://ibjarates.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">IBJA</a>.
              {' '}Prices exclude GST, local and state taxes, and jeweller markups.
            </>
          )}
        </p>
        <PageTimestamp lastUpdated={prices.lastUpdated} />
      </div>
      <MetalsClient prices={prices} />
    </div>
  );
}
