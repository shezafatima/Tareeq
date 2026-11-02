// Content shapes. Each one is written like a database row: a stable id, an explicit order,
// and nothing that belongs to a component. See specs/003-home-core-pages/data-model.md.

export type Audience = {
  id: string;
  name: string;
  benefit: string;
  order: number;
};

export type StepId = "prompt" | "build" | "learn";

export type Step = {
  id: StepId;
  label: string;
  heading: string;
  body: string;
  order: number;
};

export type ProgramStatus = "available" | "coming-soon";

export type Program = {
  id: string;
  slug: string;
  name: string;
  audience: string;
  outcomes: string[];
  duration: string;
  format: string;
  bring: string[];
  status: ProgramStatus;
  order: number;
};

export type Principle = {
  id: string;
  heading: string;
  text: string;
  order: number;
};

export type StorySectionId = "story" | "meaning" | "approach" | "vision" | "mission" | "people";

export type StorySection = {
  id: StorySectionId;
  heading: string;
  paragraphs: string[];
  highlight?: { script: string; transliteration: string; meaning: string };
  order: number;
};

export type ContactKind = "whatsapp" | "email" | "location";

export type ContactDetail = {
  kind: ContactKind;
  label: string;
  value: string;
  href?: string;
};

export type PageSlug = "home" | "our-way" | "programs" | "contact";

export type PageMeta = {
  slug: PageSlug;
  title: string;
  description: string;
  /** the page's h1 and the lines above and below it */
  heading: string;
  eyebrow?: string;
  intro?: string;
};

export type TrustFact = {
  id: string;
  text: string;
  order: number;
};

export type ContactCta = { line: string; label: string };

export type SectionCopy = { heading: string; intro?: string };

export type HomeCopy = {
  whoItsFor: SectionCopy;
  howItWorks: SectionCopy;
  programs: SectionCopy & { linkLabel: string };
  why: SectionCopy;
  cta: { line: string; label: string; href: string };
};
