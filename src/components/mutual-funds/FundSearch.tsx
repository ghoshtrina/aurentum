'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SearchInput } from '@/components/ui/SearchInput';
import { fetchClassifiedSchemes } from '@/lib/cache/mf-list-cache';
import type { ClassifiedScheme } from '@/lib/api/mfapi';

export function FundSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [schemes, setSchemes] = useState<ClassifiedScheme[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchClassifiedSchemes().then(setSchemes);
  }, []);

  const results = useMemo(() => {
    if (query.length < 2) return [];
    const q = query.toLowerCase();
    return schemes
      .filter((s) => s.schemeName.toLowerCase().includes(q))
      .slice(0, 50);
  }, [query, schemes]);

  useEffect(() => {
    if (query.length < 2) {
      setOpen(false);
      return;
    }
    setOpen(results.length > 0);
  }, [query, results]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim().length >= 2) {
      setOpen(false);
      router.push(`/mutual-funds/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <SearchInput
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search mutual funds (e.g., HDFC Flexi Cap)"
        onFocus={() => results.length > 0 && setOpen(true)}
      />
      {open && (
        <div className="absolute z-50 mt-1 max-h-80 w-full overflow-y-auto rounded-lg border border-border bg-card shadow-lg">
          {results.map((fund) => (
            <Link
              key={fund.schemeCode}
              href={`/mutual-funds/${fund.schemeCode}`}
              onClick={() => setOpen(false)}
              className="block border-b border-border px-4 py-3 text-sm transition-colors last:border-0 hover:bg-muted"
            >
              <span className="font-medium">{fund.schemeName}</span>
              <span className="ml-2 text-xs text-muted-foreground">#{fund.schemeCode}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
