import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import Container from "@/components/ui/Container";
import { AUDIENCE_LABELS, type Program } from "@/lib/programs/options";
import { visibleFacts } from "@/lib/programs/view";
import ProgramCover from "./ProgramCover";
import ProgramCta from "./ProgramCta";
import ProgramFacts from "./ProgramFacts";
import StatusChip from "./StatusChip";

/**
 * One program on /programs. Server component. Its colours, number and surface come from its place in the list,
 * in CSS (.program-* in globals.css), so filtering never re-renders it.
 */
export default function ProgramPanel({ program }: { program: Program }) {
  const quiet = program.status === "coming-soon";

  return (
    <article className="program-panel">
      <ProgramCover
        url={program.coverImageUrl}
        sizes="(min-width: 1024px) 36vw, 1px"
        className="program-panel__cover"
      />
      <Container className="program-panel__inner">
        <div aria-hidden="true" className="program-number">
          <span className="program-number__shape" />
        </div>
        <div className="program-panel__body">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--panel-muted)]">
              {AUDIENCE_LABELS[program.audience]}
            </p>
            <StatusChip status={program.status} />
          </div>
          <h2 className="program-panel__title font-heading font-bold text-[var(--panel-fg)]">{program.title}</h2>
          <ProgramFacts facts={visibleFacts(program)} limit={3} className="text-[var(--panel-muted)]" />
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <ProgramCta
              program={program}
              variant={quiet ? "secondary" : "primary"}
              className={quiet ? "program-cta-quiet" : "program-cta"}
            />
            <Link
              href={`/programs/${program.slug}`}
              className="group inline-flex min-h-11 items-center gap-2 font-semibold text-[var(--panel-fg)] underline-offset-4 hover:underline"
            >
              View program
              <span className="sr-only">: {program.title}</span>
              <ArrowRight
                aria-hidden="true"
                weight="bold"
                className="size-4 transition-transform duration-[var(--dur-base)] ease-[var(--ease-soft)] group-hover:translate-x-1 motion-reduce:transform-none"
              />
            </Link>
          </div>
        </div>
      </Container>
    </article>
  );
}
