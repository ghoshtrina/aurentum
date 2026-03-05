import Link from 'next/link';
import { searchSchemes, filterDirectGrowth } from '@/lib/api/mfapi';

const POPULAR_FUNDS = [
  { schemeCode: 118989, schemeName: 'HDFC Flexi Cap Fund - Direct Plan - Growth' },
  { schemeCode: 120503, schemeName: 'SBI Small Cap Fund - Direct Plan - Growth' },
  { schemeCode: 120505, schemeName: 'SBI Equity Hybrid Fund - Direct Plan - Growth' },
  { schemeCode: 118834, schemeName: 'Axis Bluechip Fund - Direct Plan - Growth' },
  { schemeCode: 119598, schemeName: 'Parag Parikh Flexi Cap Fund - Direct Plan - Growth' },
  { schemeCode: 120716, schemeName: 'Mirae Asset Large Cap Fund - Direct Plan - Growth' },
  { schemeCode: 125354, schemeName: 'UTI Nifty 50 Index Fund - Direct Plan - Growth' },
];

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: Props) {
  const { q } = await searchParams;
  return {
    title: q ? `"${q}" - Search Mutual Funds - Aurentum` : 'Search Mutual Funds - Aurentum',
  };
}

export default async function SearchResultsPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = q?.trim() ?? '';

  let funds: Array<{ schemeCode: number; schemeName: string }> = [];
  let isPopular = false;

  if (query.length >= 2) {
    const results = await searchSchemes(query);
    funds = filterDirectGrowth(results);
  }

  if (funds.length === 0) {
    funds = POPULAR_FUNDS;
    isPopular = true;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <Link
          href="/mutual-funds"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Mutual Funds
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">
          {isPopular
            ? 'Popular Funds'
            : `Results for "${query}"`}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isPopular
            ? `No results found for "${query}". Here are some popular funds.`
            : `${funds.length} funds found`}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <ul className="divide-y divide-border">
          {funds.map((fund) => (
            <li key={fund.schemeCode}>
              <Link
                href={`/mutual-funds/${fund.schemeCode}`}
                className="block px-4 py-3 text-sm transition-colors hover:bg-muted"
              >
                {fund.schemeName}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
