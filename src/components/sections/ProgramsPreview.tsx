import HomeProgramCard from "@/components/sections/HomeProgramCard";
import Section from "@/components/sections/Section";
import Button from "@/components/ui/Button";
import ChevronRight from "@/components/ui/ChevronRight";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import { getHomeCopy, getOnlineCoursesCard } from "@/content";
import type { HomeProgramCard as HomeProgramCardData } from "@/content";
import { loadPublishedPrograms } from "@/lib/programs/data";
import { toHomeCard } from "@/lib/programs/view";
import { getWhatsAppUrlWithMessage } from "@/lib/site";

/** Internal path, WhatsApp link, or null when the call to action cannot be drawn (no WhatsApp number set). */
function resolveCta(card: HomeProgramCardData): string | null {
  return card.cta.kind === "link" ? card.cta.href : getWhatsAppUrlWithMessage(card.cta.message);
}

// Server component. Equal cards: one column on phones, two from md, three from lg. A short last row is centred (globals.css).
export default async function ProgramsPreview() {
  const [programs, copy, onlineCourses] = await Promise.all([loadPublishedPrograms(), getHomeCopy(), getOnlineCoursesCard()]);
  // no programs could be read: leave the section out rather than show the fixed card alone
  if (!programs) return null;
  // only what visitors can act on now; "See all programs" leads to the rest
  const cards = [...programs.filter((p) => p.status !== "coming-soon").map(toHomeCard), onlineCourses];

  return (
    <Section id="programs" labelledBy="programs-title" tone="paper" divider decoration="circles">
      <Reveal>
        <SectionHeading id="programs-title" intro={copy.programs.intro}>
          {copy.programs.heading}
        </SectionHeading>
      </Reveal>
      <ul className="program-grid mt-10 grid auto-rows-fr gap-4 lg:gap-6">
        {cards.map((c, i) => (
          <Reveal as="li" key={c.id} index={i}>
            <HomeProgramCard card={c} ctaHref={resolveCta(c)} />
          </Reveal>
        ))}
      </ul>
      <Reveal className="mt-10" index={cards.length}>
        <Button href="/programs" variant="secondary">
          {copy.programs.linkLabel}
          <ChevronRight />
        </Button>
      </Reveal>
    </Section>
  );
}
