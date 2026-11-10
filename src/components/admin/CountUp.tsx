"use client"; // needs an effect and animation frames (the number counts up once after load)

import { useEffect, useRef } from "react";

const DURATION_MS = 800; // the count-up is exempt from the 150-250 ms rule (spec FR-029), capped at 800 ms

/**
 * Shows `value`, counting up from 0 once when it first appears. The server renders the final number, so the page is
 * correct without JavaScript and under reduced motion (which skips the count entirely).
 */
export default function CountUp({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || value <= 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const start = performance.now();
    el.textContent = "0";
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION_MS);
      el.textContent = String(Math.round(value * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      el.textContent = String(value);
    };
  }, [value]);

  return (
    <span ref={ref} className={className} suppressHydrationWarning>
      {value}
    </span>
  );
}
