// Picks a free web address when one filled in from a title is taken (specs/025-courses-catalog/research.md R4). Pure.
import { SLUG_MAX } from "../programs/options.ts";

/** `base` if free, otherwise the lowest free `base-N` (N >= 2), with `base` trimmed so the result fits in `max`. */
export function nextFreeSlug(base: string, taken: Iterable<string>, max: number = SLUG_MAX): string {
  const used = new Set(taken);
  if (!used.has(base)) return base;
  for (let n = 2; ; n++) {
    const suffix = `-${n}`;
    const stem = base.slice(0, Math.max(1, max - suffix.length)).replace(/-+$/g, "");
    const candidate = `${stem}${suffix}`;
    if (!used.has(candidate)) return candidate;
  }
}
