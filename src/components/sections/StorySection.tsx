import Section from "@/components/sections/Section";
import Reveal from "@/components/ui/Reveal";
import type { StorySection as StorySectionData } from "@/content";

type StorySectionProps = {
  section: StorySectionData;
  tone?: "paper" | "soft";
  /** a soft curve along the top edge, in this section's tone */
  divider?: boolean;
};

/** One block of the Our Way page: a heading, its paragraphs, and (for the name) the Urdu word as a designed feature. */
export default function StorySection({ section, tone = "paper", divider }: StorySectionProps) {
  const titleId = `story-${section.id}`;
  const { highlight } = section;
  return (
    <Section labelledBy={titleId} tone={tone} divider={divider} className="lg:py-16">
      <div className="grid gap-8 lg:grid-cols-[1fr_2fr] lg:gap-16">
        <Reveal>
          <h2 id={titleId} className="font-heading text-3xl font-bold leading-tight tracking-[-0.015em] text-midnight sm:text-4xl">
            {section.heading}
          </h2>
        </Reveal>
        <Reveal index={1} className="max-w-prose space-y-6 text-lg leading-relaxed text-midnight/85">
          {highlight && (
            <div className="relative overflow-hidden rounded-card bg-white p-6 shadow-card-rest ring-1 ring-royal/10 sm:p-8">
              <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5 bg-saffron" />
              <p lang="ur" dir="rtl" className="text-7xl font-semibold leading-snug text-midnight sm:text-8xl">
                {highlight.script}
              </p>
              <span aria-hidden="true" className="draw-in mt-1 block h-1 w-40 rounded-full bg-saffron sm:w-56" />
              <p className="mt-5 font-heading text-2xl font-bold text-royal">
                {highlight.transliteration}
                <span className="font-sans text-lg font-normal text-midnight/75">, “{highlight.meaning}”</span>
              </p>
            </div>
          )}
          <div className="space-y-4">
            {section.paragraphs.map((text) => (
              <p key={text}>{text}</p>
            ))}
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
