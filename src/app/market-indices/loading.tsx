import { Skeleton } from '@/components/ui/Skeleton';

export default function MarketIndicesLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Skeleton className="mb-2 h-8 w-48" />
      <Skeleton className="mb-6 h-4 w-72" />
      {[5, 2, 2, 2].map((count, i) => (
        <div key={i} className="mb-8">
          <Skeleton className="mb-3 h-6 w-32" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: count }).map((_, j) => (
              <Skeleton key={j} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
