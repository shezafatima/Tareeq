import Button from "@/components/ui/Button";
import ChevronRight from "@/components/ui/ChevronRight";
import Container from "@/components/ui/Container";
import type { HomeProgramCard } from "@/content";
import { onlineCoursesHref } from "@/lib/site";
import ProgramFacts from "./ProgramFacts";
import StatusChip from "./StatusChip";

/** The fixed "Online courses" card on /programs. Not a stored program: no number and no program page. */
export default function OnlineCoursesPanel({ card }: { card: HomeProgramCard }) {
  return (
    <article className="program-panel">
      <Container className="program-panel__inner">
        <div className="program-panel__body">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--panel-muted)]">Online</p>
            <StatusChip status={card.status} />
          </div>
          <h2 className="program-panel__title font-heading font-bold text-[var(--panel-fg)]">{card.title}</h2>
          <p className="text-base text-[var(--panel-muted)] lg:text-lg">{card.audience}</p>
          <ProgramFacts facts={card.facts} className="text-[var(--panel-muted)]" />
          <div>
            <Button href={onlineCoursesHref} className="program-cta">
              {card.cta.label}
              <span className="sr-only">: {card.title}</span>
              <ChevronRight />
            </Button>
          </div>
        </div>
      </Container>
    </article>
  );
}
