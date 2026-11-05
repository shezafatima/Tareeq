// DRAFT: owner to confirm before launch. Placeholders for review: all five names and benefit lines, the "Grades 6-10" label,
// the "See how" link label and the two WhatsApp messages (no personal data in them).
import { joinHref } from "@/lib/site";
import type { Audience } from "./types";

export const audiences: Audience[] = [
  {
    id: "teachers",
    name: "Teachers",
    benefit: "Plan lessons and make quizzes in minutes, not hours.",
    cta: { kind: "link", label: "See how", href: joinHref },
    order: 1,
  },
  {
    id: "school-students",
    name: "School students (Grades 6-10)",
    benefit: "Use AI to learn and build, not to copy.",
    cta: { kind: "link", label: "See how", href: joinHref },
    order: 2,
  },
  {
    id: "college-students",
    name: "College & university students",
    benefit: "Turn AI into a skill employers ask for.",
    cta: {
      kind: "whatsapp",
      label: "See how",
      message: "Hi Tareeq, I'm a college or university student and I'd like to ask about your programs.",
    },
    order: 3,
  },
  {
    id: "online-learners",
    name: "Online learners",
    benefit: "Learn at your pace, from beginner to advanced.",
    cta: { kind: "link", label: "See how", href: "/register" },
    order: 4,
  },
  {
    id: "corporate-teams",
    name: "Corporate teams",
    benefit: "Cut repetitive work with tools your team will actually use.",
    cta: {
      kind: "whatsapp",
      label: "See how",
      message: "Hi Tareeq, I'd like to ask about AI training for our team.",
    },
    order: 5,
  },
];
