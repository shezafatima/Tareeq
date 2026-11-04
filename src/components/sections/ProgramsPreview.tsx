import ProgramCard from "@/components/sections/ProgramCard";
import Section from "@/components/sections/Section";
import Button from "@/components/ui/Button";
import ChevronRight from "@/components/ui/ChevronRight";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import { getHomeCopy, getProgramPreview } from "@/content";

export default async function ProgramsPreview() {
  const [programs, copy] = await Promise.all([getProgramPreview(3), getHomeCopy()]);
  if (programs.length === 0) return null;

  return (
    <Section id="programs" labelledBy="programs-title" tone="paper" divider decoration="circles">
      <Reveal>
        <SectionHeading id="programs-title" intro={copy.programs.intro}>
          {copy.programs.heading}
        </SectionHeading>
      </Reveal>
      <ul className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {programs.map((p, i) => (
          <Reveal as="li" key={p.id} index={i} className="h-full">
            <ProgramCard program={p} />
          </Reveal>
        ))}
      </ul>
      <Reveal className="mt-10" index={3}>
        <Button href="/programs" variant="secondary">
          {copy.programs.linkLabel}
          <ChevronRight />
        </Button>
      </Reveal>
    </Section>
  );
}
