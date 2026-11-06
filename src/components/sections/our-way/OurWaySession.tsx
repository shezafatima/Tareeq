import OurWaySection from "@/components/sections/our-way/OurWaySection";
import WayHeading from "@/components/sections/our-way/WayHeading";
import Reveal from "@/components/ui/Reveal";
import type { OurWayContent } from "@/content";

/** Try, Make, Reflect. The numbered chips are the ones How it works uses, so the two read as relatives. */
export default function OurWaySession({ content }: { content: OurWayContent["session"] }) {
  return (
    <OurWaySection id="way-session" labelledBy="way-session-title" tone="midnight" side="right">
      <Reveal>
        <WayHeading id="way-session-title">{content.heading}</WayHeading>
      </Reveal>
      <ol className="way-steps mt-12">
        {content.steps.map((step, i) => (
          <Reveal as="li" index={i} key={step.id} className="way-step">
            <span className="way-step-head">
              <span className="step-num">{step.number}</span>
              <span className="font-heading text-2xl font-bold lg:text-3xl">{step.name}</span>
            </span>
            <p className="way-step-line mt-3 text-lg leading-relaxed text-white/85">{step.line}</p>
          </Reveal>
        ))}
      </ol>
    </OurWaySection>
  );
}
