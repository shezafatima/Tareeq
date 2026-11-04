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
      "Why we started Tareeq, what the name means, and how we teach: hands-on, from your own work, with honest talk about what AI gets wrong.",
    heading: "Learn the way you work",
    eyebrow: "Our Way",
    intro: "Why we started Tareeq, what the name means, and how we teach.",
  },
  {
    slug: "programs",
    title: "Programs",
    description:
      "Workshops for teachers, students and teams. See who each is for, what you will be able to do afterwards, how long it takes and what to bring.",
    heading: "Workshops you can use the next day",
    eyebrow: "Programs",
    intro:
      "Each workshop starts from your own work. Here is who each one is for, what you can do afterwards, and what to bring.",
  },
  {
    slug: "contact",
    title: "Contact",
    description:
      "Message Tareeq on WhatsApp or write to us to ask about a workshop for your school, class or team. We reply as soon as we can.",
    heading: "Talk to us",
    eyebrow: "Contact",
    intro: "Ask about a workshop for your school, class or team. A short message is enough.",
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
    description: "Leave your details for Tareeq's online AI courses and we'll WhatsApp you when a course opens.",
    heading: courseFormLabel,
    eyebrow: "Online courses",
    intro: "Leave your details and we'll WhatsApp you when the course opens, with dates and fees.",
  },
];
