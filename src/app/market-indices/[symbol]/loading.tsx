import { Skeleton } from '@/components/ui/Skeleton';

export default function IndexDetailLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Skeleton className="mb-2 h-4 w-32" />
      <Skeleton className="mb-2 h-7 w-64" />
      <Skeleton className="mb-6 h-4 w-48" />
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="mt-6 h-[350px] w-full rounded-xl" />
    </div>
  );
}
