'use client';

import { useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils/cn';

interface AutoShrinkTextProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Renders text on a single line, automatically shrinking the font
 * if the text would overflow its container.
 */
export function AutoShrinkText({ children, className }: AutoShrinkTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  const adjust = useCallback(() => {
    const container = containerRef.current;
    const text = textRef.current;
    if (!container || !text) return;

    // Reset font size to measure natural width
    text.style.fontSize = '';
    const containerWidth = container.clientWidth;
    const textWidth = text.scrollWidth;

    if (textWidth > containerWidth) {
      const ratio = containerWidth / textWidth;
      // Clamp to minimum 0.6x
      const scale = Math.max(ratio * 0.95, 0.6);
      text.style.fontSize = `${scale}em`;
    }
  }, []);

  useEffect(() => {
    adjust();

    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver(adjust);
    ro.observe(container);
    return () => ro.disconnect();
  }, [adjust, children]);

  return (
    <div ref={containerRef} className="overflow-hidden">
      <span ref={textRef} className={cn('inline-block whitespace-nowrap', className)}>
        {children}
      </span>
    </div>
  );
}
