import OurWaySection from "@/components/sections/our-way/OurWaySection";
import type { OurWayContent } from "@/content";

/** The name, what it means, and the one-line manifesto. Shown at once, since it is the first thing on the page. */
export default function OurWayOpening({ content }: { content: OurWayContent["opening"] }) {
  return (
    <OurWaySection id="way-opening" labelledBy="way-opening-title" tone="paper" side="left" position="first">
      <p lang="ur" dir="rtl" className="way-word text-midnight">
        {content.word}
      </p>
      <h1 id="way-opening-title" className="way-h1 page-enter-h1 font-heading font-bold text-midnight">
        {content.meaning}
      </h1>
      <p className="page-enter mt-6 max-w-2xl text-xl leading-relaxed text-midnight/80 lg:text-2xl" style={{ "--d": 2 } as React.CSSProperties}>
        {content.manifesto}
      </p>
    </OurWaySection>
  );
}
