// The only import path for page content. Pages and components call these accessors; they never
// import from ./data. To move content to a database, change this file and ./data only.
import { audiences } from "./audiences";
import { courseList } from "./data/courses";
import { contactCta, contactEmpty, contactNote, readContactDetails } from "./data/contact";
import { homeCopy } from "./data/cta";
import { howItWorks } from "./how-it-works";
import { mentor } from "./mentor";
import { testimonials } from "./testimonials";
import { selectTestimonials } from "../lib/testimonials";
import { whyTareeq } from "./why-tareeq";
import { homeProgramCards } from "./home-programs";
import { courseFormLabel, leadCopy, PRIVACY_NOTE_VERSION } from "./data/leads";
import { pages } from "./data/pages";
import { programs } from "./data/programs";
import { trustFacts } from "./data/trust";
import { story } from "./data/story";
import type {
  Audience,
  ContactCta,
  ContactDetail,
  CourseOption,
  HomeCopy,
  HomeProgramCard,
  HowItWorksContent,
  WhyTareeqContent,
  LeadCopy,
  MentorContent,
  PageMeta,
  PageSlug,
  ResolvedTestimonial,
  Program,
  StorySection,
  TrustFact,
} from "./types";

export type * from "./types";

export { PRIVACY_NOTE_VERSION };

const byOrder = <T extends { order: number }>(rows: T[]): T[] => [...rows].sort((a, b) => a.order - b.order);

export async function getAudiences(): Promise<Audience[]> {
  return byOrder(audiences);
}

export async function getPrograms(): Promise<Program[]> {
  return byOrder(programs);
}

export async function getProgramPreview(limit = 3): Promise<Program[]> {
  return byOrder(programs).slice(0, limit);
}

export async function getStorySections(): Promise<StorySection[]> {
  return byOrder(story);
}

export async function getTrustFacts(): Promise<TrustFact[]> {
  return byOrder(trustFacts);
}

export async function getContactDetails(): Promise<ContactDetail[]> {
  return readContactDetails();
}

export async function getContactNote(): Promise<string> {
  return contactNote;
}

export async function getContactEmpty(): Promise<string> {
  return contactEmpty;
}

export async function getContactCta(): Promise<ContactCta> {
  return contactCta;
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

/**
 * Courses a visitor can pick on the waitlist form, always ending with "Not sure yet".
 * The single source for course options: callers must not depend on where the list comes from
 * (a hardcoded list today, published courses later).
 */
export async function getCourseOptions(): Promise<CourseOption[]> {
  return [...courseList, { id: "not-sure", name: "Not sure yet" }];
}

export async function getHowItWorks(): Promise<HowItWorksContent> {
  return { ...howItWorks, steps: byOrder(howItWorks.steps) };
}

export async function getWhyTareeq(): Promise<WhyTareeqContent> {
  return { ...whyTareeq, points: byOrder(whyTareeq.points) };
}

export async function getHomeProgramCards(): Promise<HomeProgramCard[]> {
  return byOrder(homeProgramCards);
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
