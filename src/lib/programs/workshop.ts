// Which programs the workshop page shows prices for (specs/034-pricing-certificate-announcement FR-010, research R6).
// Chosen by audience, never by slug, so renaming or adding programs in the admin keeps the page correct. Pure.
import { resolvePrice, type PriceDisplay } from "../pricing/rules.ts";
import type { Audience, Program } from "./options.ts";

export type WorkshopPriceEntry = { title: string; slug: string; price: PriceDisplay };

/** The workshop audiences, in the order they are shown. */
const WORKSHOP_AUDIENCES: readonly Audience[] = ["teachers", "school-students"];

/**
 * For each workshop audience, the first published program (in the order given, which is display order) that has
 * structured pricing. Programs without it are left out. Returns 0–2 entries; with none, the page shows no price block.
 */
export function pickWorkshopPrograms(programs: Program[]): WorkshopPriceEntry[] {
  const out: WorkshopPriceEntry[] = [];
  for (const audience of WORKSHOP_AUDIENCES) {
    const found = programs.find((p) => p.published && p.audience === audience && p.pricing);
    if (found) out.push({ title: found.title, slug: found.slug, price: resolvePrice(found.pricing, found.priceText) });
  }
  return out;
}
