'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { extractAMC } from '@/lib/constants/mf-amcs';

interface Scheme {
  schemeCode: number;
  schemeName: string;
}

interface AMCBrowserProps {
  schemes: Scheme[];
}

export function AMCBrowser({ schemes }: AMCBrowserProps) {
  const [showAll, setShowAll] = useState(false);

  const amcGroups = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of schemes) {
      const amc = extractAMC(s.schemeName);
      counts.set(amc, (counts.get(amc) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .filter(([name]) => name !== 'Other')
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [schemes]);

  if (amcGroups.length === 0) return null;

  const visible = showAll ? amcGroups : amcGroups.slice(0, 5);
  const hasMore = amcGroups.length > 5;

  return (
    <div className="space-y-1">
      {visible.map((amc) => (
        <Link
          key={amc.name}
          href={`/mutual-funds/amc/${encodeURIComponent(amc.name)}`}
          className="flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
        >
          <span>{amc.name}</span>
          <span className="text-xs text-muted-foreground">{amc.count} funds</span>
        </Link>
      ))}

      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full cursor-pointer rounded-lg px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {showAll ? 'Show Less' : 'Show All'}
        </button>
      )}
    </div>
  );
}
