// DEV-ONLY placeholders (spec 012). Loaded by getTestimonials() only when NODE_ENV !== "production" and no real
// approved item exists. Never import this file anywhere else. Obviously fake on purpose: no realistic people.
import type { Testimonial } from "./types";

export const placeholders: Testimonial[] = [
  { youtubeUrl: "https://www.youtube.com/shorts/PLACEHOLD01", name: "Placeholder name", role: "Teacher", organization: "Placeholder school", quote: "Placeholder quote: one short line from a teacher.", consent: true, published: true, order: 1 },
  { youtubeUrl: "https://www.youtube.com/shorts/PLACEHOLD02", name: "Placeholder name", role: "Student", quote: "Placeholder quote: one short line from a student.", consent: true, published: true, order: 2 },
  { youtubeUrl: "https://www.youtube.com/shorts/PLACEHOLD03", name: "Placeholder name", role: "Teacher", organization: "Placeholder school", quote: "Placeholder quote: another short line.", consent: true, published: true, order: 3 },
];
