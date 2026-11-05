import HomeProgramCard from "@/components/sections/HomeProgramCard";
import Section from "@/components/sections/Section";
import Button from "@/components/ui/Button";
import ChevronRight from "@/components/ui/ChevronRight";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import { getHomeCopy, getHomeProgramCards } from "@/content";
import type { HomeProgramCard as HomeProgramCardData } from "@/content";
import { getWhatsAppUrlWithMessage } from "@/lib/site";

/** Internal path, WhatsApp link, or null when the call to action cannot be drawn (no WhatsApp number set). */
function resolveCta(card: HomeProgramCardData): string | null {
  return card.cta.kind === "link" ? card.cta.href : getWhatsAppUrlWithMessage(card.cta.message);
}

// Server component. Bento grid: one column on phones, two from md (featured full width), four from lg (featured 2x2).
export default async function ProgramsPreview() {
  const [cards, copy] = await Promise.all([getHomeProgramCards(), getHomeCopy()]);
  if (cards.length === 0) return null;
  const featuredId = cards.find((c) => c.featured)?.id;

  return (
    <Section id="programs" labelledBy="programs-title" tone="paper" divider decoration="circles">
      <Reveal>
        <SectionHeading id="programs-title" intro={copy.programs.intro}>
          {copy.programs.heading}
        </SectionHeading>
      </Reveal>
      <ul className="mt-10 grid gap-4 md:grid-cols-2 lg:auto-rows-fr lg:grid-cols-4 lg:gap-6">
        {cards.map((c, i) => {
          const featured = c.id === featuredId;
          return (
            <Reveal as="li" key={c.id} index={i} className={featured ? "md:col-span-2 lg:row-span-2" : undefined}>
              <HomeProgramCard card={c} ctaHref={resolveCta(c)} featured={featured} />
            </Reveal>
          );
        })}
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
