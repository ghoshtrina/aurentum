'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { extractAMC } from '@/lib/constants/mf-amcs';
import { Skeleton } from '@/components/ui/Skeleton';
import { fetchClassifiedSchemes } from '@/lib/cache/mf-list-cache';

interface Props {
  amcName: string;
}

export function AMCPageClient({ amcName }: Props) {
  const [schemes, setSchemes] = useState<{ schemeCode: number; schemeName: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClassifiedSchemes()
      .then(setSchemes)
      .finally(() => setLoading(false));
  }, []);

  const funds = useMemo(
    () =>
      schemes
        .filter((s) => extractAMC(s.schemeName) === amcName)
        .sort((a, b) => a.schemeName.localeCompare(b.schemeName)),
    [schemes, amcName]
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <Link
          href="/mutual-funds"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Mutual Funds
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">{amcName}</h1>
        {!loading && (
          <p className="mt-1 text-sm text-muted-foreground">
            {funds.length} funds found
          </p>
        )}
      </div>

      {loading ? (
        <div className="rounded-xl border border-border bg-card">
          <div className="divide-y divide-border">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="px-4 py-3">
                <Skeleton className="h-4 w-full max-w-md" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card">
          {funds.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No funds found for this AMC.
            </p>
          ) : (
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
          )}
        </div>
      )}
    </div>
  );
}
