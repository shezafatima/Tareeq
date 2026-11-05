import Section from "@/components/sections/Section";
import TestimonialCard from "@/components/sections/TestimonialCard";
import TestimonialVideo from "@/components/sections/TestimonialVideo";
import VideoGroup from "@/components/sections/VideoGroup";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import { getTestimonials } from "@/content";

/**
 * Testimonials (spec 012). Server component. Shows only approved items (consent and published true); renders nothing
 * when there are none. Dev-only placeholders come from getTestimonials(); only the video slot and the group state are client.
 */
export default async function TestimonialsSection() {
  const items = await getTestimonials();
  if (items.length === 0) return null;

  return (
    <Section id="testimonials" labelledBy="testimonials-title" tone="soft">
      <Reveal>
        <SectionHeading
          id="testimonials-title"
          eyebrow="Real voices"
          intro="Short, honest videos from teachers and students who learned to use AI with Tareeq."
        >
          Don&rsquo;t take our word for it. Hear theirs.
        </SectionHeading>
      </Reveal>
      <div className="mt-10">
        <VideoGroup>
          <ol className="testimonial-strip">
            {items.map((item, i) => (
              <TestimonialCard key={`${item.videoId}-${i}`} item={item}>
                <TestimonialVideo id={String(i)} videoId={item.videoId} name={item.name} placeholder={item.isPlaceholder} />
              </TestimonialCard>
            ))}
          </ol>
        </VideoGroup>
      </div>
    </Section>
  );
}
