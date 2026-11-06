import OurWaySection from "@/components/sections/our-way/OurWaySection";
import WayHeading from "@/components/sections/our-way/WayHeading";
import Reveal from "@/components/ui/Reveal";
import type { OurWayContent } from "@/content";

export default function OurWayProblem({ content }: { content: OurWayContent["problem"] }) {
  return (
    <OurWaySection id="way-problem" labelledBy="way-problem-title" tone="midnight" side="right">
      <Reveal>
        <WayHeading id="way-problem-title">{content.heading}</WayHeading>
        <div className="mt-8 max-w-3xl space-y-5 text-xl leading-relaxed text-white/85 lg:text-2xl">
          {content.lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </Reveal>
    </OurWaySection>
  );
}
