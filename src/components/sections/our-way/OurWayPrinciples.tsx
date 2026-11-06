import OurWaySection from "@/components/sections/our-way/OurWaySection";
import WayHeading from "@/components/sections/our-way/WayHeading";
import Reveal from "@/components/ui/Reveal";
import type { OurWayContent } from "@/content";

/** On paper the numerals are dark with a saffron mark: saffron is never text on a light background (Principle III). */
export default function OurWayPrinciples({ content }: { content: OurWayContent["principles"] }) {
  return (
    <OurWaySection id="way-principles" labelledBy="way-principles-title" tone="paper" side="left">
      <Reveal>
        <WayHeading id="way-principles-title">{content.heading}</WayHeading>
      </Reveal>
      <ol className="mt-12 grid gap-12 lg:grid-cols-2 lg:gap-x-16 lg:gap-y-16">
        {content.items.map((item, i) => (
          <Reveal as="li" index={i} key={item.id}>
            <p className="way-numeral font-heading font-bold text-midnight">{item.number}</p>
            <span aria-hidden="true" className="way-mark" />
            <h3 className="mt-5 font-heading text-2xl font-bold leading-tight text-midnight lg:text-3xl">{item.title}</h3>
            <p className="mt-3 max-w-prose text-lg leading-relaxed text-midnight/80">{item.line}</p>
          </Reveal>
        ))}
      </ol>
    </OurWaySection>
  );
}
