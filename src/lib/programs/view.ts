// What pages show for a program, worked out from its stored fields. Pure, so it can be unit tested.
import type { HomeProgramCard } from "../../content/types.ts";
import { joinHref } from "../site.ts";
import { CTA_LABELS, FILTER_VALUES, STATUS_LABELS, type FilterValue, type Program } from "./options.ts";

const CLOUDINARY = "https://res.cloudinary.com/";

/** Stored order, with coming-soon programs last. */
export function sortForIndex(programs: Program[]): Program[] {
  const soon = (p: Program) => (p.status === "coming-soon" ? 1 : 0);
  return [...programs].sort((a, b) => soon(a) - soon(b) || a.order - b.order);
}

/** Facts that have a value, in display order. */
export function visibleFacts(program: Program): { label: string; value: string }[] {
  const { format, duration, groupSize, location } = program.facts;
  return [
    { label: "Format", value: format },
    { label: "Duration", value: duration },
    { label: "Group size", value: groupSize },
    { label: "Location", value: location },
  ].filter((f) => f.value);
}

export function whatsappMessage(program: Pick<Program, "title">): string {
  return `Hi Tareeq, I'd like to ask about the ${program.title} program.`;
}

export type ResolvedCta = { label: string; href: string; external: boolean };

/** Where a program's call to action goes. Null for WhatsApp when no number is set. */
export function resolveProgramCta(
  program: Program,
  toWhatsAppUrl: (message: string) => string | null,
): ResolvedCta | null {
  const label = CTA_LABELS[program.ctaType];
  if (program.ctaType === "workshop-modal") return { label, href: joinHref, external: false };
  if (program.ctaType === "register") return { label, href: "/register", external: false };
  const href = toWhatsAppUrl(whatsappMessage(program));
  return href ? { label, href, external: true } : null;
}

export function toHomeCard(program: Program): HomeProgramCard {
  const { format, duration, groupSize } = program.facts;
  const label = CTA_LABELS[program.ctaType];
  return {
    id: program.slug,
    title: program.title,
    audience: program.summary,
    status: program.status,
    statusLabel: STATUS_LABELS[program.status],
    facts: [
      { label: "Format", value: format },
      { label: "Duration", value: duration },
      { label: "Group size", value: groupSize },
    ],
    cta:
      program.ctaType === "whatsapp"
        ? { kind: "whatsapp", label, message: whatsappMessage(program) }
        : { kind: "link", label, href: program.ctaType === "register" ? "/register" : joinHref },
    order: program.order,
  };
}

/** Only images the site can optimise are drawn; anything else falls back to the brand pattern. */
export function isAllowedCover(url: string | undefined): url is string {
  if (!url) return false;
  return (url.startsWith("/") && !url.startsWith("//")) || url.startsWith(CLOUDINARY);
}

/** The audience filter in an address's query string. Anything unknown means all. */
export function parseFilter(search: string): FilterValue {
  const value = new URLSearchParams(search).get("for");
  return FILTER_VALUES.find((f) => f === value) ?? "all";
}
