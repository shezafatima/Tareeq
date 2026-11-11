// The only import path for page content. Pages and components call these accessors; they never
// import from ./data. To move content to a database, change this file and ./data only.
// Programs have already moved: they are read through src/lib/programs/data.ts.
import { audiences } from "./audiences";
import { getOfferedCourseOptions } from "../lib/courses/data";
import { readFooterContact } from "./data/footer";
import { homeCopy } from "./data/cta";
import { howItWorks } from "./how-it-works";
import { mentor } from "./mentor";
import { testimonials } from "./testimonials";
import { selectTestimonials } from "../lib/testimonials";
import { whyTareeq } from "./why-tareeq";
import { courseFormLabel, leadCopy, PRIVACY_NOTE_VERSION } from "./data/leads";
import { onlineCoursesCard } from "./online-courses";
import { ourWay } from "./our-way";
import { pages } from "./data/pages";
import { trustFacts } from "./data/trust";
import type {
  Audience,
  CourseOption,
  FooterContactItem,
  HomeCopy,
  HomeProgramCard,
  HowItWorksContent,
  WhyTareeqContent,
  LeadCopy,
  MentorContent,
  PageMeta,
  PageSlug,
  ResolvedTestimonial,
  OurWayContent,
  TrustFact,
} from "./types";

export type * from "./types";

export { PRIVACY_NOTE_VERSION };

const byOrder = <T extends { order: number }>(rows: T[]): T[] => [...rows].sort((a, b) => a.order - b.order);

export async function getAudiences(): Promise<Audience[]> {
  return byOrder(audiences);
}

/** The fixed "Online courses" card on /programs and the home page. Not a stored program. */
export async function getOnlineCoursesCard(): Promise<HomeProgramCard> {
  return onlineCoursesCard;
}

export async function getOurWay(): Promise<OurWayContent> {
  return ourWay;
}

export async function getTrustFacts(): Promise<TrustFact[]> {
  return byOrder(trustFacts);
}

export async function getFooterContact(): Promise<FooterContactItem[]> {
  return readFooterContact();
}

export async function getHomeCopy(): Promise<HomeCopy> {
  return homeCopy;
}

const defaultMeta: Omit<PageMeta, "slug"> = {
  title: "Tareeq | AI, the practical way",
  description: "Hands-on AI workshops for teachers, students and professionals.",
  heading: "Tareeq",
};

export async function getPageMeta(slug: PageSlug): Promise<PageMeta> {
  return pages.find((p) => p.slug === slug) ?? { slug, ...defaultMeta };
}

export async function getLeadCopy(): Promise<LeadCopy> {
  return leadCopy;
}

/** Heading and button label for the online course form (/register), and links to it. */
export async function getCourseFormLabel(): Promise<string> {
  return courseFormLabel;
}

const NOT_SURE: CourseOption = { id: "not-sure", name: "Not sure yet" };

/**
 * Courses a visitor can pick on the register form: published courses that are open or coming soon, grouped by category,
 * always ending with "Not sure yet". The single source for course options, read by the form and by submitCourse.
 * If the courses cannot be read, only "Not sure yet" is offered, so the form keeps working (research R9).
 */
export async function getCourseOptions(): Promise<CourseOption[]> {
  try {
    return [...(await getOfferedCourseOptions()), NOT_SURE];
  } catch (err) {
    console.error(`[courses] options read failed: ${err instanceof Error ? err.name : "UnknownError"}`);
    return [NOT_SURE];
  }
}

export async function getHowItWorks(): Promise<HowItWorksContent> {
  return { ...howItWorks, steps: byOrder(howItWorks.steps) };
}

export async function getWhyTareeq(): Promise<WhyTareeqContent> {
  return { ...whyTareeq, points: byOrder(whyTareeq.points) };
}

export async function getMentor(): Promise<MentorContent> {
  return {
    ...mentor,
    facts: byOrder(mentor.facts),
    socials: byOrder(mentor.socials),
  };
}

export async function getTestimonials(): Promise<ResolvedTestimonial[]> {
  const dev = process.env.NODE_ENV !== "production";
  // the dev-only module is imported behind a constant check so production builds drop it
  const placeholders = dev ? (await import("./testimonials.dev")).placeholders : [];
  return selectTestimonials(testimonials, {
    dev,
    placeholders,
    warn: (index) => console.warn("[testimonials] skipped item with an invalid video link, index", index),
  });
}
