import { Skeleton } from '@/components/ui/Skeleton';

export default function FundDetailLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Skeleton className="mb-2 h-6 w-96" />
      <Skeleton className="mb-6 h-4 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="mt-6 h-[350px] w-full rounded-xl" />
    </div>
  );
}
