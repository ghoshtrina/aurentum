import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { ChangeIndicator } from '@/components/ui/ChangeIndicator';
import { PageTimestamp } from '@/components/ui/PageTimestamp';
import { formatCurrency } from '@/lib/utils/format';
import { AutoShrinkText } from '@/components/ui/AutoShrinkText';
import { getAllIndices } from '@/lib/api/indices';
import { INDICES, INDEX_CATEGORIES } from '@/lib/constants/indices';

export const metadata = {
  title: 'Market Indices - Aurentum',
  description: 'Track major Indian and international market indices',
};

export const revalidate = 3600;

export default async function MarketIndicesPage() {
  const indicesData = await getAllIndices();

  // Build a map for quick lookup
  const dataMap = new Map(indicesData.map((d) => [d.symbol, d]));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Market Indices</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track major Indian and international market indices
        </p>
        <PageTimestamp lastUpdated={new Date().toISOString()} />
      </div>

      {INDEX_CATEGORIES.map((category) => {
        const categoryIndices = INDICES.filter((idx) => idx.category === category);
        return (
          <section key={category} className="mb-8">
            <h2 className="mb-3 text-lg font-semibold">{category}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {categoryIndices.map((idx) => {
                const data = dataMap.get(idx.symbol);
                return (
                  <Link
                    key={idx.symbol}
                    href={`/market-indices/${encodeURIComponent(idx.symbol)}`}
                  >
                    <Card className="flex flex-col justify-between hover:border-accent transition-colors cursor-pointer h-full">
                      <p className="text-sm font-medium">{idx.shortName}</p>
                      <div className="mt-2">
                        {data ? (
                          <>
                            <div className="text-xl font-bold tracking-tight">
                              <AutoShrinkText>{formatCurrency(data.price, idx.currency)}</AutoShrinkText>
                            </div>
                            <ChangeIndicator value={data.change1D} />
                          </>
                        ) : (
                          <>
                            <p className="text-xl font-bold tracking-tight text-muted-foreground">--</p>
                            <span className="text-sm text-muted-foreground">Unavailable</span>
                          </>
                        )}
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
