// Program vocabulary: allowed values, labels and the shape pages receive. Pure, so tests and client code can import it.
import type { StoredImage } from "../images/shared.ts";
import type { Pricing } from "../pricing/rules.ts";

export const AUDIENCES =["teachers", "school-students", "college", "corporate"] as const;
export const STATUSES = ["booking-now", "register-interest", "coming-soon"] as const;
export const CTA_TYPES = ["workshop-modal", "register", "whatsapp"] as const;
// "online" shows the fixed Online courses card: online learners are served by Courses, not by a stored program
export const FILTER_VALUES = ["all", "teachers", "students", "college", "online", "corporate"] as const;

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const SLUG_MAX = 80;

export type Audience = (typeof AUDIENCES)[number];
export type ProgramStatus = (typeof STATUSES)[number];
export type CtaType = (typeof CTA_TYPES)[number];
export type FilterValue = (typeof FILTER_VALUES)[number];

export type CurriculumStep = { title: string; description: string };
export type ProgramFactsData = { format: string; duration: string; groupSize: string; location: string };

/** A program as pages receive it: plain and JSON-safe. */
export type Program = {
  title: string;
  slug: string;
  audience: Audience;
  status: ProgramStatus;
  ctaType: CtaType;
  summary: string;
  description: string;
  outcomes: string[];
  curriculum: CurriculumStep[];
  facts: ProgramFactsData;
  priceText: string;
  /** structured price (specs/034); when absent the page shows priceText exactly as before */
  pricing?: Pricing;
  coverImageUrl?: string;
  /** the uploaded cover; wins over coverImageUrl */
  coverImage?: StoredImage;
  order: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

export const STATUS_LABELS: Record<ProgramStatus, string> = {
  "booking-now": "Booking now",
  "register-interest": "Register interest",
  "coming-soon": "Coming soon",
};

export const CTA_LABELS: Record<CtaType, string> = {
  "workshop-modal": "Book a workshop",
  register: "Register interest",
  whatsapp: "Ask on WhatsApp",
};

export const AUDIENCE_LABELS: Record<Audience, string> = {
  teachers: "Teachers",
  "school-students": "School students",
  college: "College",
  corporate: "Corporate",
};

export const FILTER_LABELS: Record<FilterValue, string> = {
  all: "All",
  teachers: "Teachers",
  students: "Students",
  college: "College",
  online: "Online",
  corporate: "Corporate",
};

export const AUDIENCE_FILTER: Record<Audience, Exclude<FilterValue, "all" | "online">> = {
  teachers: "teachers",
  "school-students": "students",
  college: "college",
  corporate: "corporate",
};
