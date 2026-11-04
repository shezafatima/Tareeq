"use client";

import { useSyncExternalStore } from "react";

/**
 * list:  no JavaScript (all steps shown as plain text)
 * live:  JavaScript, motion allowed (the carousel, auto-advance, the fade-and-rise entrance, the breathing robot)
 * still: JavaScript, reduced motion (the carousel at rest: nothing moves by itself)
 */
export type LayoutMode = "list" | "live" | "still";

const REDUCED = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const q = window.matchMedia(REDUCED);
  q.addEventListener("change", onChange);
  return () => q.removeEventListener("change", onChange);
}

function getSnapshot(): LayoutMode {
  if (!document.documentElement.hasAttribute("data-js")) return "list";
  return window.matchMedia(REDUCED).matches ? "still" : "live";
}

/**
 * The "How it works" mode CSS has already chosen (globals.css, keyed by html[data-js] and reduced motion). Client
 * code reads it only to attach the matching behaviour; it never changes the layout. Server value "list".
 */
export function useLayoutMode(): LayoutMode {
  return useSyncExternalStore(subscribe, getSnapshot, () => "list");
}
