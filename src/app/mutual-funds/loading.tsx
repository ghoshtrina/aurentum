import { Skeleton } from '@/components/ui/Skeleton';

export default function MutualFundsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Skeleton className="mb-2 h-8 w-48" />
      <Skeleton className="mb-6 h-4 w-64" />
      <Skeleton className="mb-6 h-10 w-full rounded-lg" />
      <Skeleton className="h-[300px] w-full rounded-xl" />
    </div>
  );
}
