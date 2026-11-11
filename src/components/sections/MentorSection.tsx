import MentorPhoto from "@/components/sections/MentorPhoto";
import MentorSocialCard from "@/components/sections/MentorSocialCard";
import Section from "@/components/sections/Section";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import { getMentor } from "@/content";
import { getSiteImages } from "@/lib/site-images/data";

/**
 * "Meet your mentor" (spec 011). Server component; motion is CSS (Reveal + globals.css). Only real data is shown:
 * socials without a url, facts without a value and a missing quote are left out, never faked.
 */
export default async function MentorSection() {
  const [m, images] = await Promise.all([getMentor(), getSiteImages()]);
  const socials = m.socials.flatMap((s) => (s.url?.trim() ? [{ ...s, url: s.url.trim() }] : []));
  const facts = m.facts.filter((f) => f.value?.trim()).slice(0, 3);
  const showFacts = facts.length >= 2;
  const quote = m.quote?.trim();

  return (
    <Section id="mentor" labelledBy="mentor-title" tone="paper">
      <Reveal>
        <SectionHeading id="mentor-title" eyebrow={m.eyebrow}>
          {m.heading}
        </SectionHeading>
      </Reveal>
      <div className="mt-10 grid gap-8 overflow-hidden rounded-card border border-royal/10 bg-white p-5 shadow-[var(--shadow-card-rest)] sm:p-8 lg:grid-cols-[2fr_3fr] lg:items-center lg:gap-12 lg:p-10">
        <Reveal className="mentor-photo">
          <MentorPhoto photo={images.founderPhoto} />
        </Reveal>
        <div className="min-w-0">
          <Reveal index={1}>
            <h3 className="font-heading text-2xl font-bold leading-tight text-midnight sm:text-3xl">{m.greeting}</h3>
            <p className="mt-2 text-base font-medium text-royal">{m.role}</p>
          </Reveal>
          <Reveal index={2} className="mt-5 space-y-4 text-lg leading-relaxed text-midnight/85">
            {m.bio.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </Reveal>
          {quote && (
            <Reveal index={3} className="mt-6">
              <blockquote className="rounded-r-card border-l-4 border-saffron bg-soft/60 px-5 py-4 font-heading text-lg font-semibold leading-snug text-midnight">
                {quote}
              </blockquote>
            </Reveal>
          )}
          {showFacts && (
            <Reveal index={4} className="mt-6">
              <ul className="flex flex-wrap gap-x-8 gap-y-3">
                {facts.map((f) => (
                  <li key={f.id}>
                    <span className="block font-heading text-2xl font-bold leading-none text-midnight">{f.value}</span>
                    <span className="mt-1 block text-sm text-midnight/75">{f.label}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          )}
          {socials.length > 0 && (
            <Reveal index={5} className="mt-7">
              <ul className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
                {socials.map((s) => (
                  <li key={s.id}>
                    <MentorSocialCard social={s} />
                  </li>
                ))}
              </ul>
            </Reveal>
          )}
        </div>
      </div>
    </Section>
  );
}
