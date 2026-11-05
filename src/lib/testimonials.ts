// Pure selection rules (spec 012). Relative imports only so `node --test` can run it.
import type { ResolvedTestimonial, Testimonial } from "../content/types.ts";
import { parseYouTubeId } from "./youtube.ts";

type Options = {
  /** true outside production */
  dev: boolean;
  /** shown only when dev and nothing real is approved */
  placeholders: Testimonial[];
  /** called with the item's index (never its name or url); only when dev */
  warn?: (index: number) => void;
};

/** Keeps items with consent === true and published === true and a valid link, sorted by order (ties keep list position). */
export function selectTestimonials(items: Testimonial[], { dev, placeholders, warn }: Options): ResolvedTestimonial[] {
  const real: ResolvedTestimonial[] = [];
  items.forEach((item, index) => {
    if (item.consent !== true || item.published !== true) return;
    const videoId = parseYouTubeId(item.youtubeUrl);
    if (!videoId) {
      if (dev) warn?.(index);
      return;
    }
    real.push({ ...item, videoId, isPlaceholder: false });
  });
  // Array.prototype.sort is stable, so equal orders keep their list position
  real.sort((a, b) => a.order - b.order);
  if (real.length > 0 || !dev) return real;
  return placeholders
    .map((p, i) => ({ ...p, videoId: parseYouTubeId(p.youtubeUrl) ?? `placeholder${i}`, isPlaceholder: true }))
    .sort((a, b) => a.order - b.order);
}
