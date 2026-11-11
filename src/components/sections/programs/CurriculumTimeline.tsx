import Reveal from "@/components/ui/Reveal";
import type { CurriculumStep } from "@/lib/programs/options";

/**
 * A program's curriculum (or a course's syllabus) as a vertical timeline; each step reveals on scroll. Left out when there
 * are no steps. The heading defaults to the program wording.
 */
export default function CurriculumTimeline({ steps, heading }: { steps: CurriculumStep[]; heading?: string }) {
  if (steps.length === 0) return null;
  return (
    <section aria-labelledby="program-curriculum">
      <h2 id="program-curriculum" className="font-heading text-2xl font-bold text-midnight lg:text-3xl">
        {heading ?? <>What we&apos;ll work through</>}
      </h2>
      <ol className="program-timeline mt-6">
        {steps.map((step, i) => (
          <Reveal as="li" key={step.title} index={i} className="program-timeline__step">
            <h3 className="font-heading text-lg font-semibold text-midnight">{step.title}</h3>
            {step.description && <p className="mt-1 text-base text-midnight/85">{step.description}</p>}
          </Reveal>
        ))}
      </ol>
    </section>
  );
}
