"use client";

import { useSyncExternalStore } from "react";

export type LayoutMode = "travel" | "swipe" | "list";

const WIDE = "(min-width: 1024px)";
const REDUCED = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const queries = [window.matchMedia(WIDE), window.matchMedia(REDUCED)];
  queries.forEach((q) => q.addEventListener("change", onChange));
  return () => queries.forEach((q) => q.removeEventListener("change", onChange));
}

function getSnapshot(): LayoutMode {
  if (!document.documentElement.hasAttribute("data-js")) return "list";
  if (window.matchMedia(REDUCED).matches) return "list";
  return window.matchMedia(WIDE).matches ? "travel" : "swipe";
}

/**
 * The "How it works" layout CSS has already chosen (globals.css: .hiw modes, keyed by html[data-js], width and
 * reduced motion). Client code reads it only to attach the matching behaviour; it never changes the layout.
 * Server value "list".
 */
export function useLayoutMode(): LayoutMode {
  return useSyncExternalStore(subscribe, getSnapshot, () => "list");
}
