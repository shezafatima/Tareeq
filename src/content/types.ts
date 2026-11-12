// Content shapes. Each one is written like a database row: a stable id, an explicit order,
// and nothing that belongs to a component. See specs/003-home-core-pages/data-model.md.
import type { SocialKind } from "../lib/settings/merge.ts";

export type Audience = {
  id: string;
  name: string;
  /** one line: what changes for this group */
  benefit: string;
  /** where the card goes: an internal path or a WhatsApp ask (same shape as the Programs cards) */
  cta: HomeProgramCta;
  order: number;
};

export type StepId = "prompt" | "build" | "learn";

/** One step of the "How it works" video stepper (spec 013): a short video on the tablet and a card beside it. */
export type HowStep = {
  id: StepId;
  number: 1 | 2 | 3;
  /** short label, e.g. "Prompt" (the compact cards on small screens show number + name) */
  name: string;
  /** the headline, e.g. "Ask AI the right way." */
  title: string;
  /** one supporting line */
  line: string;
  /** public path of the step video (H.264 MP4, no audio, 720p at most) */
  video: string;
  /** public path of the first-frame still shown before and instead of the video */
  poster: string;
  /** what the tablet shows, for assistive technology */
  videoLabel: string;
  order: number;
};

export type HowItWorksContent = {
  heading: string;
  /** one line under the heading */
  intro: string;
  steps: HowStep[];
};

export type HomeProgramStatus = "booking-now" | "register-interest" | "coming-soon";

export type HomeProgramCta =
  | { kind: "link"; label: string; href: string }
  | { kind: "whatsapp"; label: string; message: string };

/** One card in the home Programs section, made from a stored program by toHomeCard. */
export type HomeProgramCard = {
  id: string;
  title: string;
  audience: string;
  status: HomeProgramStatus;
  /** the words on the status chip */
  statusLabel: string;
  /** format, duration, group size; entries with an empty value are skipped */
  facts: { label: string; value: string }[];
  cta: HomeProgramCta;
  order: number;
};

export type FooterContactItem = {
  kind: "whatsapp" | "email" | "phone" | "address";
  label: string;
  value: string;
  /** absent for the address, which is plain text */
  href?: string;
  /** opens in a new tab */
  external: boolean;
};

/** A social icon in the footer; only links set in Settings appear (specs/028-site-settings research R9). */
export type FooterSocial = { kind: SocialKind; label: string; href: string };

export type PageSlug = "home" | "our-way" | "programs" | "workshop" | "register";

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


export type SectionCopy = { heading: string; intro?: string };

export type HomeCopy = {
  whoItsFor: SectionCopy;
  programs: SectionCopy & { linkLabel: string };
  cta: { line: string; label: string; href: string };
};

/** A course a visitor can pick on the register form. Read only through getCourseOptions(). */
export type CourseOption = {
  /** the course id, or "not-sure" */
  id: string;
  /** the course title, or "Not sure yet" */
  name: string;
  /** for /register?course=<slug>; absent on "Not sure yet" */
  slug?: string;
  /** category name, shown as an option group; absent when ungrouped */
  group?: string;
  /** picks the confirmation wording; absent on "Not sure yet" */
  status?: "open" | "coming-soon";
};

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
  /** waitlist wording (coming-soon course or "Not sure yet"), plus `open` for a course open for enrolment */
  course: ConfirmationCopy & { open: ConfirmationCopy };
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

/** One small credential fact on the "Meet your mentor" section (spec 011). Not shown until the owner gives a real value. */
export type MentorFact = {
  id: string;
  /** e.g. "5+"; null until the owner supplies a real one */
  value: string | null;
  /** what it counts, e.g. "years teaching" */
  label: string;
  order: number;
};

/** A public profile link. The icon and brand colour come from the id in the display. Not shown without a url. */
export type MentorSocial = {
  id: string;
  platform: string;
  handle: string;
  /** small secondary text, e.g. "1.7k subscribers" */
  followers: string;
  url: string | null;
  order: number;
};

export type MentorContent = {
  eyebrow: string;
  heading: string;
  photo: { src: string; width: number; height: number; alt: string };
  greeting: string;
  role: string;
  /** two short paragraphs */
  bio: string[];
  /** one sentence; null hides the block */
  quote: string | null;
  /** at most three are shown, and only when two or more have a value */
  facts: MentorFact[];
  socials: MentorSocial[];
};

/** One person's video story (spec 012). The admin (spec 031) writes this shape to the database; keep it stable. */
export type Testimonial = {
  /** YouTube Shorts, watch or youtu.be link */
  youtubeUrl: string;
  name: string;
  /** e.g. "Teacher" */
  role: string;
  organization?: string;
  /** one short line */
  quote: string;
  /** the person agreed to be shown; must be exactly true */
  consent: boolean;
  /** the owner approved it for the site; must be exactly true */
  published: boolean;
  order: number;
};

/** What the section renders: a Testimonial plus the parsed video id. Not part of the source contract. */
export type ResolvedTestimonial = Testimonial & { videoId: string; isPlaceholder: boolean };

/** The Our Way page (spec 016). */
export type OurWayContent = {
  opening: {
    /** the Urdu word. The font file holds only these letters: see specs/016-our-way-page/research.md (R1) */
    word: string;
    /** the page's h1 */
    meaning: string;
    manifesto: string;
  };
  problem: { heading: string; lines: string[] };
  principles: {
    heading: string;
    items: { id: string; number: string; title: string; line: string }[];
  };
  session: {
    heading: string;
    steps: { id: "try" | "make" | "reflect"; number: number; name: string; line: string }[];
  };
  purpose: {
    heading: string;
    vision: { heading: string; text: string };
    mission: { heading: string; text: string };
  };
  closing: {
    heading: string;
    mentorLabel: string;
    bookLabel: string;
  };
};
