import { PencilSimple } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { AdminProgram } from "@/lib/admin/programs-read";
import { AUDIENCE_LABELS, STATUS_LABELS, type ProgramStatus } from "@/lib/programs/options";
import PublishedToggle from "./PublishedToggle";
import StatusChip, { type ChipTone } from "./StatusChip";

const STATUS_TONE: Record<ProgramStatus, ChipTone> = {
  "booking-now": "royal",
  "register-interest": "sky",
  "coming-soon": "grey",
};

/** One program in the admin grid: title, audience, status, the instant published switch and an edit link. */
export default function ProgramCard({ program }: { program: AdminProgram }) {
  return (
    <article className="flex h-full flex-col rounded-2xl bg-soft p-5 shadow-sm ring-1 ring-midnight/10">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-midnight/80">{AUDIENCE_LABELS[program.audience]}</p>
        <StatusChip label={STATUS_LABELS[program.status]} tone={STATUS_TONE[program.status]} />
      </div>
      <h2 className="mt-3 font-heading text-lg font-bold text-midnight">{program.title}</h2>
      <p className="mt-1 line-clamp-2 text-sm text-midnight/80">{program.summary}</p>
      <p className="mt-2 text-xs text-midnight/70">
        /programs/{program.slug} · order {program.order}
      </p>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4">
        <PublishedToggle id={program.id} title={program.title} published={program.published} />
        <Link
          href={`/admin/programs/${program.id}/edit`}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-midnight/70 bg-white px-4 text-sm font-semibold text-midnight hover:bg-midnight/5"
        >
          <PencilSimple weight="duotone" size={18} aria-hidden="true" />
          Edit
          <span className="sr-only"> {program.title}</span>
        </Link>
      </div>
    </article>
  );
}
