import Container from "@/components/ui/Container";
import { AUDIENCE_LABELS, type Program } from "@/lib/programs/options";
import { isAllowedCover } from "@/lib/programs/view";
import ProgramCover from "./ProgramCover";
import StatusChip from "./StatusChip";

/** Top of a program page: title, summary and status over the cover image or brand pattern. Holds the page's only h1. */
export default function ProgramHeader({ program }: { program: Program }) {
  return (
    <header className="relative isolate overflow-hidden bg-midnight text-white">
      <ProgramCover url={program.coverImageUrl} sizes="100vw" priority className="absolute inset-0 -z-10" />
      {isAllowedCover(program.coverImageUrl) && <div aria-hidden="true" className="absolute inset-0 -z-10 bg-midnight/70" />}
      <Container className="flex min-h-[24rem] flex-col justify-end gap-5 pb-10 pt-16 lg:min-h-[32rem] lg:pb-16">
        <div className="page-enter flex flex-wrap items-center gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/90">
            {AUDIENCE_LABELS[program.audience]}
          </p>
          <StatusChip status={program.status} />
        </div>
        <h1 className="program-detail-title page-enter-h1 max-w-4xl font-heading font-bold">{program.title}</h1>
        <p className="page-enter max-w-2xl text-lg text-white/90 lg:text-xl" style={{ "--d": 1 } as React.CSSProperties}>
          {program.summary}
        </p>
      </Container>
    </header>
  );
}
