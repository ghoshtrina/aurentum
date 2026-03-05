import { cn } from '@/lib/utils/cn';

export function Card({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-5 shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
