'use client';

import { cn } from '@/lib/utils/cn';

interface TimeRangeSelectorProps {
  ranges: string[];
  selected: string;
  onChange: (range: string) => void;
}

export function TimeRangeSelector({ ranges, selected, onChange }: TimeRangeSelectorProps) {
  return (
    <div className="flex gap-1 rounded-lg bg-muted p-1">
      {ranges.map((range) => (
        <button
          key={range}
          onClick={() => onChange(range)}
          className={cn(
            'rounded-md px-3 py-1 text-xs font-medium transition-colors',
            selected === range
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {range}
        </button>
      ))}
    </div>
  );
}
