'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { SearchInput } from '@/components/ui/SearchInput';

interface Fund {
  schemeCode: number;
  schemeName: string;
}

interface CategoryFundListProps {
  funds: Fund[];
}

export function CategoryFundList({ funds }: CategoryFundListProps) {
  const [filter, setFilter] = useState('');

  const filtered = useMemo(() => {
    if (!filter.trim()) return funds;
    const q = filter.toLowerCase();
    return funds.filter((f) => f.schemeName.toLowerCase().includes(q));
  }, [funds, filter]);

  return (
    <>
      <div className="mb-4">
        <SearchInput
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter funds..."
        />
        <p className="mt-2 text-xs text-muted-foreground">
          {filtered.length} of {funds.length} funds
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card">
        {filtered.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">
            No funds match your filter.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((fund) => (
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
        )}
      </div>
    </>
  );
}
