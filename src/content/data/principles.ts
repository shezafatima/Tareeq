// DRAFT: owner to confirm before launch
import type { Principle } from "../types";

export const principles: Principle[] = [
  {
    id: "hands-on",
    heading: "Hands-on",
    text: "You work on a laptop or phone from the first ten minutes. Nobody sits through a lecture.",
    order: 1,
  },
  {
    id: "real-problems",
    heading: "Real problems",
    text: "You bring a task from your own classroom, study or job. We work on that, not on a made-up example.",
    order: 2,
  },
  {
    id: "next-day",
    heading: "Usable the next day",
    text: "You leave with something you built and know how to use, so Monday morning looks a little easier.",
    order: 3,
  },
  {
    id: "no-fluff",
    heading: "No fluff",
    text: "Plain language, clear steps, and honest talk about what AI gets wrong.",
    order: 4,
  },
];
