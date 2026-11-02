"use client";

import { useSyncExternalStore } from "react";

export type MotionMode = "travel" | "fade" | "none";

const WIDE = "(min-width: 1024px)";
const REDUCED = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const queries = [window.matchMedia(WIDE), window.matchMedia(REDUCED)];
  queries.forEach((q) => q.addEventListener("change", onChange));
  return () => queries.forEach((q) => q.removeEventListener("change", onChange));
}

function getSnapshot(): MotionMode {
  if (window.matchMedia(REDUCED).matches) return "none";
  return window.matchMedia(WIDE).matches ? "travel" : "fade";
}

/**
 * How the "How it works" section may move. Reduced motion wins at every width.
 * The server value is "none" (the final state), so the page is complete before any script runs.
 */
export function useMotionMode(): MotionMode {
  return useSyncExternalStore(subscribe, getSnapshot, () => "none");
}
