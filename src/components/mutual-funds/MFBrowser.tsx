'use client';

import { useState, useEffect } from 'react';
import { CategoryTree } from './CategoryTree';
import { AMCBrowser } from './AMCBrowser';
import { Skeleton } from '@/components/ui/Skeleton';
import { fetchClassifiedSchemes } from '@/lib/cache/mf-list-cache';
import type { ClassifiedScheme } from '@/lib/api/mfapi';

export function MFBrowser() {
  const [schemes, setSchemes] = useState<ClassifiedScheme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClassifiedSchemes()
      .then(setSchemes)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">Browse by Category</h2>
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
        <div className="mt-6 rounded-xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">Browse by AMC</h2>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Browse by Category</h2>
        <CategoryTree schemes={schemes} />
      </div>
      <div className="mt-6 rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Browse by AMC</h2>
        <AMCBrowser schemes={schemes} />
      </div>
    </>
  );
}
