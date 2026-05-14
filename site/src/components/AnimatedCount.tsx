'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  value: number;
  duration?: number;        // ms
  className?: string;
  formatter?: (n: number) => string;
}

// Eases-out a count from the previous value to the new value over `duration` ms.
// Cheap rAF loop — no library. Skips animation on the first render so SSR
// numbers don't tick up from zero on hydration.
export default function AnimatedCount({
  value,
  duration = 600,
  className,
  formatter = n => Math.round(n).toLocaleString('en-US'),
}: Props) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (fromRef.current === value) return;
    const from = fromRef.current;
    const to = value;
    startRef.current = null;

    const step = (t: number) => {
      if (startRef.current === null) startRef.current = t;
      const elapsed = t - startRef.current;
      const progress = Math.min(1, elapsed / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (to - from) * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = to;
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return <span className={className}>{formatter(display)}</span>;
}
