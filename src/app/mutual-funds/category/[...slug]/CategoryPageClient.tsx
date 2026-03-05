'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { CategoryFundList } from '@/components/mutual-funds/CategoryFundList';
import { Skeleton } from '@/components/ui/Skeleton';
import { fetchClassifiedSchemes } from '@/lib/cache/mf-list-cache';
import type { ClassifiedScheme } from '@/lib/api/mfapi';

interface Props {
  category: string;
  subCategory?: string;
}

export function CategoryPageClient({ category, subCategory }: Props) {
  const [schemes, setSchemes] = useState<ClassifiedScheme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClassifiedSchemes()
      .then(setSchemes)
      .finally(() => setLoading(false));
  }, []);

  const funds = useMemo(
    () =>
      schemes
        .filter(
          (f) =>
            f.category === category &&
            (!subCategory || f.subCategory === subCategory)
        )
        .sort((a, b) => a.schemeName.localeCompare(b.schemeName)),
    [schemes, category, subCategory]
  );

  const heading = subCategory ? `${category} — ${subCategory}` : category;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <Link
          href="/mutual-funds"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Mutual Funds
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">{heading}</h1>
        {!loading && (
          <p className="mt-1 text-sm text-muted-foreground">
            {funds.length} funds found
          </p>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full rounded-lg" />
          <div className="rounded-xl border border-border bg-card">
            <div className="divide-y divide-border">
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i} className="px-4 py-3">
                  <Skeleton className="h-4 w-full max-w-md" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <CategoryFundList funds={funds} />
      )}
    </div>
  );
}
