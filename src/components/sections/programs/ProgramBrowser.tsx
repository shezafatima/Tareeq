import Link from "next/link";
import Container from "@/components/ui/Container";
import Reveal from "@/components/ui/Reveal";
import type { HomeProgramCard } from "@/content";
import { footerContactHref } from "@/lib/site";
import { AUDIENCE_FILTER, FILTER_VALUES, type FilterValue, type Program } from "@/lib/programs/options";
import OnlineCoursesPanel from "./OnlineCoursesPanel";
import ProgramFilter from "./ProgramFilter";
import ProgramFilterScript from "./ProgramFilterScript";
import ProgramPanel from "./ProgramPanel";

const LIST_ID = "program-list";

type ProgramBrowserProps = {
  heading: string;
  intro?: string;
  /** null: the programs could not be read */
  programs: Program[] | null;
  /** fixed card, not a stored program: it stays when programs cannot be read */
  onlineCourses: HomeProgramCard;
};

function countByFilter(programs: Program[]): Record<FilterValue, number> {
  const counts = Object.fromEntries(FILTER_VALUES.map((v) => [v, 0])) as Record<FilterValue, number>;
  counts.all = programs.length + 1; // the fixed Online courses card
  counts.online = 1;
  for (const p of programs) counts[AUDIENCE_FILTER[p.audience]] += 1;
  return counts;
}

/** The /programs page body: big heading, audience chips and the numbered panels. Holds the page's only h1. */
export default function ProgramBrowser({ heading, intro, programs, onlineCourses }: ProgramBrowserProps) {
  return (
    <>
      <Container as="header" className="pb-10 pt-12 lg:pb-16 lg:pt-20">
        <h1 className="program-hero-title page-enter-h1 font-heading font-bold text-midnight">{heading}</h1>
        {intro && (
          <p className="page-enter mt-5 max-w-3xl text-lg text-midnight/85 lg:text-xl" style={{ "--d": 1 } as React.CSSProperties}>
            {intro}
          </p>
        )}
        {programs && programs.length > 0 && <ProgramFilter listId={LIST_ID} counts={countByFilter(programs)} />}
      </Container>

      {(programs === null || programs.length === 0) && (
        <Container className="pb-10 lg:pb-16">
          <p className="max-w-2xl text-lg text-midnight">
            We can&apos;t show our programs right now. Please try again soon, or{" "}
            <Link href={footerContactHref} className="font-semibold text-royal underline underline-offset-4">
              contact us
            </Link>{" "}
            and we&apos;ll help you find the right one.
          </p>
        </Container>
      )}
      {/* data-active is set before hydration by ProgramFilterScript */}
      <ul id={LIST_ID} className="program-list" suppressHydrationWarning>
        {(programs ?? []).map((program, i) => (
          <Reveal
            as="li"
            key={program.slug}
            index={i}
            data-item={program.slug}
            data-filter={AUDIENCE_FILTER[program.audience]}
            data-status={program.status}
          >
            <ProgramPanel program={program} />
          </Reveal>
        ))}
        {/* last, unnumbered and on its own surface: it is a way to Courses, not a program */}
        <Reveal as="li" index={programs?.length ?? 0} data-item={onlineCourses.id} data-filter="online" data-fixed="true">
          <OnlineCoursesPanel card={onlineCourses} />
        </Reveal>
      </ul>
      <ProgramFilterScript listId={LIST_ID} />
    </>
  );
}
