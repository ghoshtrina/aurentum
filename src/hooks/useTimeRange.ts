'use client';

import { useState, useCallback } from 'react';

export function useTimeRange(defaultRange = '1M') {
  const [range, setRange] = useState(defaultRange);

  const handleRangeChange = useCallback((newRange: string) => {
    setRange(newRange);
  }, []);

  return { range, setRange: handleRangeChange };
}
