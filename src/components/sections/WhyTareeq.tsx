import Section from "@/components/sections/Section";
import IconTile from "@/components/ui/IconTile";
import type { IconName } from "@/components/ui/icons";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import { getHomeCopy, getPrinciples } from "@/content";

// Presentation only: which icon goes with which principle row.
const icons: Record<string, IconName> = {
  "hands-on": "tool",
  "real-problems": "target",
  "next-day": "clock",
  "no-fluff": "check",
};

export default async function WhyTareeq() {
  const [principles, copy] = await Promise.all([getPrinciples(), getHomeCopy()]);
  if (principles.length === 0) return null;

  return (
    <Section labelledBy="why-title" tone="white" divider>
      <Reveal>
        <SectionHeading id="why-title" intro={copy.why.intro}>
          {copy.why.heading}
        </SectionHeading>
      </Reveal>
      <ul className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
        {principles.map((p, i) => (
          <Reveal as="li" key={p.id} index={i} className="flex gap-5 border-l-2 border-saffron pl-5">
            <IconTile name={icons[p.id] ?? "check"} />
            <div>
              <h3 className="font-heading text-xl font-bold text-midnight">{p.heading}</h3>
              <p className="mt-2 text-base leading-relaxed text-midnight/80">{p.text}</p>
            </div>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}
