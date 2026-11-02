// The only import path for page content. Pages and components call these accessors; they never
// import from ./data. To move content to a database, change this file and ./data only.
import { audiences } from "./data/audiences";
import { contactCta, contactEmpty, contactNote, readContactDetails } from "./data/contact";
import { homeCopy } from "./data/cta";
import { pages } from "./data/pages";
import { principles } from "./data/principles";
import { programs } from "./data/programs";
import { steps } from "./data/steps";
import { trustFacts } from "./data/trust";
import { story } from "./data/story";
import type {
  Audience,
  ContactCta,
  ContactDetail,
  HomeCopy,
  PageMeta,
  PageSlug,
  Principle,
  Program,
  Step,
  StorySection,
  TrustFact,
} from "./types";

export type * from "./types";

const byOrder = <T extends { order: number }>(rows: T[]): T[] => [...rows].sort((a, b) => a.order - b.order);

export async function getAudiences(): Promise<Audience[]> {
  return byOrder(audiences);
}

export async function getSteps(): Promise<Step[]> {
  return byOrder(steps);
}

export async function getPrograms(): Promise<Program[]> {
  return byOrder(programs);
}

export async function getProgramPreview(limit = 3): Promise<Program[]> {
  return byOrder(programs).slice(0, limit);
}

export async function getPrinciples(): Promise<Principle[]> {
  return byOrder(principles);
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
