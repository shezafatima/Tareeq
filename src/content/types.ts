// Content shapes. Each one is written like a database row: a stable id, an explicit order,
// and nothing that belongs to a component. See specs/003-home-core-pages/data-model.md.

export type Audience = {
  id: string;
  name: string;
  benefit: string;
  order: number;
};

export type StepId = "prompt" | "build" | "learn";

/** One card of the "How it works" section (spec 007): the front explains the step, the back gives one example. */
export type HowStep = {
  id: StepId;
  number: number;
  /** the title on the front, e.g. "Prompt" */
  name: string;
  /** one-line explanation on the front */
  line: string;
  /** one concrete example, shown on the back */
  example: string;
  order: number;
};

export type HowItWorksContent = {
  heading: string;
  /** one line under the heading */
  intro: string;
  steps: HowStep[];
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

export type PageSlug = "home" | "our-way" | "programs" | "contact" | "workshop" | "register";

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
  programs: SectionCopy & { linkLabel: string };
  cta: { line: string; label: string; href: string };
};

/** A course a visitor can pick on the waitlist form. Read only through getCourseOptions(). */
export type CourseOption = { id: string; name: string };

type ConfirmationCopy = {
  /** confirmation heading */
  confirmHeading: string;
  /** what actually happens next, and roughly when */
  confirmNext: string;
  /** prefilled WhatsApp text; "{ref}" is replaced with the reference. No personal data. */
  whatsappPrefill: string;
};

export type LeadCopy = {
  workshop: ConfirmationCopy & { submitLabel: string; bookLabel: string };
  course: ConfirmationCopy;
  consentLabel: string;
  privacyNote: string;
  guardianNote: string;
  referenceLabel: string;
  whatsappButton: string;
  closeLabel: string;
  sendingLabel: string;
  formErrors: { summaryHeading: string; rateLimited: string; internal: string; whatsappLink: string };
};

/** One of the four reasons in the "Why Tareeq" section (spec 008): a number, a title and one sentence. */
export type WhyPoint = {
  id: "learn-by-doing" | "skills-that-matter" | "learning-for-everyone" | "create-with-confidence";
  /** shown as text: "01" to "04" */
  number: string;
  title: string;
  text: string;
  order: number;
};

export type WhyTareeqContent = {
  heading: string;
  /** one line under the heading (draft) */
  intro: string;
  /** exactly four, in order */
  points: WhyPoint[];
};
