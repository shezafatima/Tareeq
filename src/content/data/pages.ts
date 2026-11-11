// DRAFT: owner to confirm before launch
import type { PageMeta } from "../types";
import { courseFormLabel } from "./leads";

export const pages: PageMeta[] = [
  {
    slug: "home",
    title: "Tareeq | AI, the practical way",
    description:
      "Hands-on AI workshops for teachers, students and professionals. You bring a real task. You leave with something you built.",
    heading: "Every idea needs a path.",
  },
  {
    slug: "our-way",
    title: "Our Way",
    description:
      "Why Tareeq exists and how we teach: you build something real in every session, and learn to check what AI gets wrong.",
    heading: "Tareeq means 'the way'.",
  },
  {
    slug: "programs",
    title: "Programs",
    description:
      "Workshops and courses for teachers, students, colleges and teams. See who each is for, how it runs and what you will leave with.",
    heading: "Pick your way in.",
    intro: "Every program starts from your own work. Choose the one that fits you.",
  },
  {
    slug: "workshop",
    title: "Workshops",
    description:
      "Hands-on AI workshops for schools and teachers in Karachi. You bring a real task and leave with something you built.",
    heading: "AI workshops for schools and teachers",
    eyebrow: "Workshops",
    intro:
      "Hands-on sessions where you bring a real task and leave with something you built. Tell us about your school and we will agree a date and format with you."
  },
  {
    slug: "register",
    title: courseFormLabel,
    // DRAFT: owner to confirm (025-courses-catalog): the waitlist wording is gone now that real courses can be open
    description: "Register for a Tareeq online AI course. Leave your details and we'll WhatsApp you with dates and fees.",
    heading: courseFormLabel,
    eyebrow: "Online courses",
    intro: "Leave your details and we'll WhatsApp you about your course, with dates and fees.",
  },
];
