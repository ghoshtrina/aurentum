'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { MF_CATEGORIES, CATEGORY_DISPLAY_ORDER } from '@/lib/constants/mf-categories';

interface CategorizedScheme {
  schemeCode: number;
  schemeName: string;
  category: string;
  subCategory: string;
}

interface CategoryTreeProps {
  schemes: CategorizedScheme[];
}

export function CategoryTree({ schemes }: CategoryTreeProps) {
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  const categoryCounts = new Map<string, number>();
  const subCategoryCounts = new Map<string, number>();
  for (const s of schemes) {
    categoryCounts.set(s.category, (categoryCounts.get(s.category) ?? 0) + 1);
    const key = `${s.category}|${s.subCategory}`;
    subCategoryCounts.set(key, (subCategoryCounts.get(key) ?? 0) + 1);
  }

  const categoryDefs = new Map(MF_CATEGORIES.map((c) => [c.name, c]));

  return (
    <div className="space-y-1">
      {CATEGORY_DISPLAY_ORDER.map((catName) => {
        const cat = categoryDefs.get(catName);
        if (!cat) return null;
        const catCount = categoryCounts.get(cat.name) ?? 0;
        if (catCount === 0) return null;

        return (
          <div key={cat.name}>
            <button
              onClick={() => setExpandedCat(expandedCat === cat.name ? null : cat.name)}
              className={cn(
                'flex w-full cursor-pointer items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-muted',
                expandedCat === cat.name && 'bg-muted'
              )}
            >
              <span>{cat.name}</span>
              <span className="text-xs text-muted-foreground">{catCount} funds</span>
            </button>

            {expandedCat === cat.name && (
              <div className="ml-4 space-y-0.5">
                {cat.subCategories.map((sub) => {
                  const subKey = `${cat.name}|${sub.name}`;
                  const subCount = subCategoryCounts.get(subKey) ?? 0;
                  if (subCount === 0) return null;

                  return (
                    <Link
                      key={sub.name}
                      href={`/mutual-funds/category/${encodeURIComponent(cat.name)}/${encodeURIComponent(sub.name)}`}
                      className="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted/50"
                    >
                      <span>{sub.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {subCount}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
