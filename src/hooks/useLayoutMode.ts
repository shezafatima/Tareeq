"use client";

import { useSyncExternalStore } from "react";

/**
 * list:   no JavaScript (all steps shown as plain text)
 * travel: JavaScript, 768px and up, motion allowed (cards travel from the hero, then the carousel)
 * phone:  JavaScript, under 768px, motion allowed (carousel; it fades and rises in)
 * still:  JavaScript, reduced motion (carousel at rest: nothing moves by itself)
 */
export type LayoutMode = "list" | "travel" | "phone" | "still";

const TRAVEL_FROM = "(min-width: 768px)";
const REDUCED = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const queries = [window.matchMedia(TRAVEL_FROM), window.matchMedia(REDUCED)];
  queries.forEach((q) => q.addEventListener("change", onChange));
  return () => queries.forEach((q) => q.removeEventListener("change", onChange));
}

function getSnapshot(): LayoutMode {
  if (!document.documentElement.hasAttribute("data-js")) return "list";
  if (window.matchMedia(REDUCED).matches) return "still";
  return window.matchMedia(TRAVEL_FROM).matches ? "travel" : "phone";
}

/**
 * The "How it works" mode CSS has already chosen (globals.css, keyed by html[data-js], width and reduced motion).
 * Client code reads it only to attach the matching behaviour; it never changes the layout. Server value "list".
 */
export function useLayoutMode(): LayoutMode {
  return useSyncExternalStore(subscribe, getSnapshot, () => "list");
}
