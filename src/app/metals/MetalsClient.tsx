'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { MetalPriceCard } from '@/components/metals/MetalPriceCard';
import { PurityCalculator } from '@/components/metals/PurityCalculator';
import { MetalChart } from '@/components/metals/MetalChart';
import type { MetalPricesResult } from '@/lib/api/metals';

interface MetalsClientProps {
  prices: MetalPricesResult;
}

const TABS = [
  { key: 'gold', label: 'Gold' },
  { key: 'silver', label: 'Silver' },
] as const;

type Tab = (typeof TABS)[number]['key'];

export function MetalsClient({ prices }: MetalsClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('gold');
  const unavailable = prices.source === 'unavailable';

  return (
    <div className="space-y-6">
      {prices.marketClosed && (
        <div className="rounded-xl border border-border bg-card p-4 text-center text-sm text-muted-foreground">
          Indian bullion markets are closed right now. Showing latest available prices.
        </div>
      )}

      {unavailable && (
        <div className="rounded-xl border border-border bg-card p-6 text-center text-muted-foreground">
          Metal price data is currently unavailable. Configure GOLD_API_KEY or check back later.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Left column: tabs + price cards + chart */}
        <div className="lg:col-span-3 space-y-6">
          {/* Tabs - full width of left column */}
          <div className="flex gap-1 rounded-lg bg-muted p-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex-1 rounded-md py-2 text-sm font-medium transition-colors',
                  activeTab === tab.key
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Gold tab content */}
          {activeTab === 'gold' && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
                <MetalPriceCard
                  label="Gold 24K (99.9%)"
                  pricePerGram={prices.gold24kPerGram}
                  change1D={prices.goldChange1D}
                  isEstimated={prices.isEstimated}
                />
                <MetalPriceCard
                  label="Gold 22K (91.6%)"
                  pricePerGram={prices.gold22kPerGram}
                  change1D={prices.goldChange1D != null ? prices.goldChange1D : undefined}
                  isEstimated={prices.isEstimated}
                />
                <MetalPriceCard
                  label="Gold 18K (75%)"
                  pricePerGram={prices.gold18kPerGram}
                  change1D={prices.goldChange1D != null ? prices.goldChange1D : undefined}
                  isEstimated={prices.isEstimated}
                />
                <MetalPriceCard
                  label="Gold 14K (58.3%)"
                  pricePerGram={prices.gold14kPerGram}
                  change1D={prices.goldChange1D != null ? prices.goldChange1D : undefined}
                  isEstimated={prices.isEstimated}
                />
                <MetalPriceCard
                  label="Gold 9K (37.5%)"
                  pricePerGram={prices.gold9kPerGram}
                  change1D={prices.goldChange1D != null ? prices.goldChange1D : undefined}
                  isEstimated={prices.isEstimated}
                />
              </div>
              <MetalChart metal="gold" label="Gold 24K" currentPricePerGram={prices.gold24kPerGram} />
            </div>
          )}

          {/* Silver tab content */}
          {activeTab === 'silver' && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <MetalPriceCard
                  label="Silver 999 Fine (99.9%)"
                  pricePerGram={prices.silver999PerGram}
                  change1D={prices.silverChange1D}
                  isEstimated={prices.isEstimated}
                />
                <MetalPriceCard
                  label="Silver 925 Sterling (92.5%)"
                  pricePerGram={prices.silver925PerGram}
                  change1D={prices.silverChange1D != null ? prices.silverChange1D : undefined}
                  isEstimated={prices.isEstimated}
                />
              </div>
              <MetalChart metal="silver" label="Silver 999" currentPricePerGram={prices.silver999PerGram} />
            </div>
          )}
        </div>

        {/* Right column: purity calculator */}
        <div>
          <PurityCalculator
            gold24kPerGram={prices.gold24kPerGram}
            silver999PerGram={prices.silver999PerGram}
          />
        </div>
      </div>
    </div>
  );
}
