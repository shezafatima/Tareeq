"use client"; // renders from the form's live state, so it re-renders on every keystroke

import ProgramPanel from "@/components/sections/programs/ProgramPanel";
import type { ContactDetails } from "@/lib/settings/merge";
import type { ProgramFormValues } from "@/lib/admin/programs-schema";
import { parsePricingLoose } from "@/lib/pricing/rules";
import { AUDIENCE_FILTER, type Program } from "@/lib/programs/options";

function toProgram(v: ProgramFormValues): Program {
  const order = Number(v.order);
  // what is valid so far, so the price block follows the Pricing fields as they are typed
  const pricing = parsePricingLoose(v.pricing);
  return {
    title: v.title.trim() || "Program title",
    slug: v.slug.trim() || "program-slug",
    audience: v.audience,
    status: v.status,
    ctaType: v.ctaType,
    summary: v.summary.trim() || "A short summary of the program appears here.",
    description: v.description,
    outcomes: v.outcomes.filter((o) => o.trim()),
    curriculum: v.curriculum.filter((s) => s.title.trim()),
    facts: {
      format: v.facts.format.trim(),
      duration: v.facts.duration.trim(),
      groupSize: v.facts.groupSize.trim(),
      location: v.facts.location.trim(),
    },
    priceText: v.priceText.trim(),
    ...(pricing ? { pricing } : {}),
    ...(v.coverImageUrl.trim() ? { coverImageUrl: v.coverImageUrl.trim() } : {}),
    ...(v.coverImage ? { coverImage: v.coverImage } : {}),
    order: Number.isFinite(order) ? order : 0,
    published: v.published,
    createdAt: "",
    updatedAt: "",
  };
}

/**
 * How the program will look on the public Programs page. It is the public ProgramPanel itself, inside the same list
 * markup the page uses (that is what gives it its colours), fed by the form. `inert` keeps its links from being clickable.
 */
export default function ProgramPreview({ values, contact }: { values: ProgramFormValues; contact: ContactDetails }) {
  const program = toProgram(values);
  return (
    <section aria-label="Preview of the public Programs page">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-midnight/70">Preview</p>
      <div className="overflow-hidden rounded-2xl ring-1 ring-midnight/10">
        <ul className="program-list !p-0" inert>
          <li data-filter={AUDIENCE_FILTER[program.audience]} data-status={program.status}>
            <ProgramPanel program={program} contact={contact} />
          </li>
        </ul>
      </div>
    </section>
  );
}
