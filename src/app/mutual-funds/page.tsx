import { FundSearch } from '@/components/mutual-funds/FundSearch';
import { MFBrowser } from '@/components/mutual-funds/MFBrowser';
import { PageTimestamp } from '@/components/ui/PageTimestamp';

export const metadata = {
  title: 'Mutual Funds - Aurentum',
  description: 'Browse and search Indian mutual funds with SEBI classification',
};

export default function MutualFundsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Mutual Funds</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse and search Indian mutual funds (Direct Growth plans)
        </p>
        <PageTimestamp lastUpdated={new Date().toISOString()} />
      </div>

      <div className="mb-6">
        <FundSearch />
      </div>

      <MFBrowser />
    </div>
  );
}
