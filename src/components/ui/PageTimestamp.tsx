'use client';

import { useEffect, useState } from 'react';
import { formatDateTime } from '@/lib/utils/format';

interface PageTimestampProps {
  lastUpdated?: string;
}

export function PageTimestamp({ lastUpdated }: PageTimestampProps) {
  const [now, setNow] = useState<string | null>(null);
  const [updated, setUpdated] = useState<string | null>(null);

  useEffect(() => {
    setNow(formatDateTime(new Date()));
    if (lastUpdated) {
      setUpdated(formatDateTime(lastUpdated));
    }
  }, [lastUpdated]);

  if (!now) return null;

  return (
    <p className="mt-1 text-xs text-muted-foreground">
      {now}
      {updated && <span>. Last updated: {updated}</span>}
    </p>
  );
}
