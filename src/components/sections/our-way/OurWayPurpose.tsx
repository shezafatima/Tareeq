import OurWaySection from "@/components/sections/our-way/OurWaySection";
import WayHeading from "@/components/sections/our-way/WayHeading";
import Reveal from "@/components/ui/Reveal";
import type { OurWayContent } from "@/content";

export default function OurWayPurpose({ content }: { content: OurWayContent["purpose"] }) {
  const statements = [content.vision, content.mission];
  return (
    <OurWaySection id="way-purpose" labelledBy="way-purpose-title" tone="paper" side="left">
      <Reveal>
        <WayHeading id="way-purpose-title">{content.heading}</WayHeading>
      </Reveal>
      <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-16">
        {statements.map((s, i) => (
          <Reveal index={i} key={s.heading}>
            <h3 className="font-heading text-2xl font-bold text-midnight lg:text-3xl">{s.heading}</h3>
            <p className="mt-3 max-w-prose text-lg leading-relaxed text-midnight/80 lg:text-xl">{s.text}</p>
          </Reveal>
        ))}
      </div>
    </OurWaySection>
  );
}
