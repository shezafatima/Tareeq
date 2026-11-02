import Section from "@/components/sections/Section";
import Card from "@/components/ui/Card";
import IconTile from "@/components/ui/IconTile";
import type { IconName } from "@/components/ui/icons";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import { getAudiences, getHomeCopy } from "@/content";

// Presentation only: which icon goes with which audience row.
const icons: Record<string, IconName> = {
  teachers: "teacher",
  "school-students": "student",
  "college-students": "graduate",
  "professionals-teams": "team",
};

export default async function WhoItsFor() {
  const [audiences, copy] = await Promise.all([getAudiences(), getHomeCopy()]);
  if (audiences.length === 0) return null;

  return (
    <Section id="who" labelledBy="who-title" decoration="circles">
      <Reveal>
        <SectionHeading id="who-title" intro={copy.whoItsFor.intro}>
          {copy.whoItsFor.heading}
        </SectionHeading>
      </Reveal>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {audiences.map((a, i) => (
          <Reveal as="li" key={a.id} index={i} className="h-full">
            <Card lift className="relative flex h-full flex-col overflow-hidden">
              <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-saffron" />
              <IconTile name={icons[a.id] ?? "check"} />
              <h3 className="mt-4 font-heading text-xl font-bold text-midnight">{a.name}</h3>
              <p className="mt-3 text-base leading-relaxed text-midnight/80">{a.benefit}</p>
            </Card>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}
