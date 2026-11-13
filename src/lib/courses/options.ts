// Course vocabulary: allowed values, labels and the shapes pages receive. Pure, so tests and client code can import it.
// See specs/025-courses-catalog/data-model.md.
import type { StoredImage } from "../images/shared.ts";
import type { Pricing } from "../pricing/rules.ts";
export { SLUG_MAX, SLUG_PATTERN } from "../programs/options.ts";

export const LEVELS = ["beginner", "intermediate", "advanced"] as const;
export const FORMATS = ["live", "self-paced", "recorded"] as const;
export const ENROLLMENT_STATUSES = ["open", "coming-soon", "closed"] as const;
/** Statuses shown on /courses and offered on the register form. */
export const LISTED_STATUSES = ["open", "coming-soon"] as const;

export type Level = (typeof LEVELS)[number];
export type Format = (typeof FORMATS)[number];
export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];
export type ListedStatus = (typeof LISTED_STATUSES)[number];

export const LEVEL_LABELS: Record<Level, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const FORMAT_LABELS: Record<Format, string> = {
  live: "Live online",
  "self-paced": "Self-paced",
  recorded: "Recorded",
};

export const ENROLLMENT_LABELS: Record<EnrollmentStatus, string> = {
  open: "Open",
  "coming-soon": "Coming soon",
  closed: "Registration closed",
};

export type SyllabusItem = { title: string; description: string };

export type CourseCategory = { id: string; name: string; slug: string; description: string; order: number };

/** A course as pages receive it: plain and JSON-safe. `category` is null when its category no longer exists. */
export type Course = {
  id: string;
  title: string;
  slug: string;
  category: { name: string; slug: string } | null;
  level: Level;
  summary: string;
  description: string;
  outcomes: string[];
  syllabus: SyllabusItem[];
  format: Format;
  durationText: string;
  startDateText: string;
  priceText: string;
  /** structured price (specs/034); when absent the page shows priceText exactly as before */
  pricing?: Pricing;
  enrollmentStatus: EnrollmentStatus;
  coverImageUrl?: string;
  /** the uploaded cover; wins over coverImageUrl */
  coverImage?: StoredImage;
  featured: boolean;
  order: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

/** What CourseCard draws. Shared by /courses and the admin live preview. */
export type CourseCardData = Pick<
  Course,
  "title" | "slug" | "category" | "level" | "format" | "durationText" | "enrollmentStatus" | "priceText" | "pricing" | "coverImageUrl" | "coverImage" | "summary"
>;

export const isLevel = (v: unknown): v is Level => typeof v === "string" && (LEVELS as readonly string[]).includes(v);
export const isEnrollmentStatus = (v: unknown): v is EnrollmentStatus =>
  typeof v === "string" && (ENROLLMENT_STATUSES as readonly string[]).includes(v);
