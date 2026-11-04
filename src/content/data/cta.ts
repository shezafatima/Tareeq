// DRAFT: owner to confirm before launch
import { joinHref } from "@/lib/site";
import type { HomeCopy } from "../types";

export const homeCopy: HomeCopy = {
  whoItsFor: {
    heading: "Who it’s for",
    intro: "If you teach, study or work, there is a place for you.",
  },
  programs: {
    heading: "Programs",
    intro: "Pick the one that fits you. More are on the way.",
    linkLabel: "See all programs",
  },
  cta: {
    line: "Bring one real task. Leave with something you built.",
    label: "Join a workshop",
    href: joinHref,
  },
};
