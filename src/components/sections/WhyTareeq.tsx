import Section from "@/components/sections/Section";
import { DotGrid, Sparkle, WavyLine } from "@/components/sections/SaffronAccents";
import IconTile from "@/components/ui/IconTile";
import type { IconName } from "@/components/ui/icons";
import Reveal from "@/components/ui/Reveal";
import RobotStage from "@/components/ui/RobotStage";
import SectionHeading from "@/components/ui/SectionHeading";
import { getWhyTareeq } from "@/content";
import { robotImage } from "@/content/robot-image";

// Presentation only: which icon goes with which point.
const icons: Record<string, IconName> = {
  "learn-by-doing": "hand",
  "skills-that-matter": "brain",
  "learning-for-everyone": "users",
  "create-with-confidence": "shieldCheck",
};

// Server component. The mirror of "How it works": the robot (shared RobotStage) on the right from 1024px, one navy
// card with the four points on the left; stacked on phones in the same order as How it works.
export default async function WhyTareeq() {
  const content = await getWhyTareeq();
  if (content.points.length === 0) return null;

  return (
    <Section id="why" labelledBy="why-title" tone="white" divider>
      <div className="why-stage">
        <Reveal className="why-head">
          <SectionHeading id="why-title" intro={content.intro}>
            {content.heading}
          </SectionHeading>
        </Reveal>
        <div className="why-robot relative">
          <WavyLine className="pointer-events-none absolute -right-6 -top-4 hidden w-20 text-saffron lg:block" />
          <RobotStage image={robotImage} />
        </div>
        <Reveal className="why-card">
          <Sparkle className="pointer-events-none absolute -right-2 -top-5 size-8 text-saffron sm:-right-4 sm:size-10" />
          <DotGrid className="pointer-events-none absolute -bottom-6 -left-3 size-14 text-saffron/70 sm:-left-6 sm:size-16" />
          <article className="relative rounded-card bg-midnight p-6 text-white sm:p-8">
            <ol className="space-y-6">
              {content.points.map((p) => (
                <li key={p.id} className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-start sm:gap-4 sm:text-left">
                  <span aria-hidden="true" className="shrink-0 font-heading text-2xl font-bold leading-none text-saffron sm:w-9">
                    {p.number}
                  </span>
                  <IconTile tone="onDark" name={icons[p.id] ?? "check"} />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-heading text-xl font-bold text-white">{p.title}</h3>
                    <p className="mt-1.5 text-base leading-relaxed text-white/85">{p.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </article>
        </Reveal>
      </div>
    </Section>
  );
}
