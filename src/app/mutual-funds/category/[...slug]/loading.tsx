import { Skeleton } from '@/components/ui/Skeleton';

export default function CategoryLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Skeleton className="mb-2 h-4 w-32" />
      <Skeleton className="mb-2 h-8 w-64" />
      <Skeleton className="mb-6 h-4 w-48" />
      <Skeleton className="mb-4 h-10 w-full rounded-lg" />
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
  );
}
