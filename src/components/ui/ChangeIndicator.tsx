import { cn } from '@/lib/utils/cn';
import { formatPercent } from '@/lib/utils/format';

interface ChangeIndicatorProps {
  value: number | undefined;
  className?: string;
}

export function ChangeIndicator({ value, className }: ChangeIndicatorProps) {
  if (value === undefined || value === null) {
    return <span className={cn('text-sm text-muted-foreground', className)}>--</span>;
  }

  const isPositive = value >= 0;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-sm font-medium',
        isPositive ? 'text-positive' : 'text-negative',
        className
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className={cn('h-4 w-4', !isPositive && 'rotate-180')}
      >
        <path
          fillRule="evenodd"
          d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z"
          clipRule="evenodd"
        />
      </svg>
      {formatPercent(value)}
    </span>
  );
}
