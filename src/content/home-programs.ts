// DRAFT: owner to confirm before launch. Placeholders for review: every group size; the online courses, college & university
// and corporate facts and audiences; the "Grades 6-10" audience (the /programs page still says "School and college students");
// the WhatsApp messages. Kept from the existing programs data: the teacher audience, "Half a day" and "In person, at your school".
import { joinHref } from "@/lib/site";
import type { HomeProgramCard } from "./types";

export const homeProgramCards: HomeProgramCard[] = [
  {
    id: "teachers-workshop",
    title: "AI for Teachers workshop",
    audience: "School and college teachers",
    status: "booking-now",
    statusLabel: "Booking now",
    facts: [
      { label: "Format", value: "In person, at your school" },
      { label: "Duration", value: "Half a day" },
      { label: "Group size", value: "Up to 30 teachers" },
    ],
    cta: { kind: "link", label: "Book a workshop", href: joinHref },
    featured: true,
    order: 1,
  },
  {
    id: "student-workshops",
    title: "School student workshops",
    audience: "Grades 6-10",
    status: "booking-now",
    statusLabel: "Booking now",
    facts: [
      { label: "Format", value: "In person or online" },
      { label: "Duration", value: "Half a day" },
      { label: "Group size", value: "Up to 30 students" },
    ],
    cta: { kind: "link", label: "Book a workshop", href: joinHref },
    order: 2,
  },
  {
    id: "online-courses",
    title: "Online courses",
    audience: "Anyone ready to learn at their own pace",
    status: "register-interest",
    statusLabel: "Register interest",
    facts: [
      { label: "Format", value: "Online, guided" },
      { label: "Duration", value: "A few weeks" },
    ],
    cta: { kind: "link", label: "Register interest", href: "/register" },
    order: 3,
  },
  {
    id: "college-university",
    title: "College & university",
    audience: "College and university students",
    status: "coming-soon",
    statusLabel: "Coming soon",
    facts: [
      { label: "Format", value: "On campus or online" },
      { label: "Group size", value: "Whole classes" },
    ],
    cta: {
      kind: "whatsapp",
      label: "Ask on WhatsApp",
      message: "Hi Tareeq, I'd like to ask about your college and university programs.",
    },
    order: 4,
  },
  {
    id: "corporate-teams",
    title: "Corporate teams",
    audience: "Professionals and teams",
    status: "coming-soon",
    statusLabel: "Coming soon",
    facts: [
      { label: "Format", value: "At your office or online" },
      { label: "Group size", value: "Teams of 10-30" },
    ],
    cta: {
      kind: "whatsapp",
      label: "Ask on WhatsApp",
      message: "Hi Tareeq, I'd like to ask about your programs for corporate teams.",
    },
    order: 5,
  },
];
