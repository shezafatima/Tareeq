import AudienceCard from "@/components/sections/AudienceCard";
import Section from "@/components/sections/Section";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import { getAudiences, getHomeCopy } from "@/content";
import type { Audience } from "@/content";
import { getContactFallbackHref, getWhatsAppUrlWithMessage } from "@/lib/site";

/** Internal path, or a WhatsApp link; with no WhatsApp number set the ask falls back to the footer's email link. */
function resolveCta(a: Audience): { href: string; external: boolean } {
  if (a.cta.kind === "link") return { href: a.cta.href, external: false };
  const wa = getWhatsAppUrlWithMessage(a.cta.message);
  return wa ? { href: wa, external: true } : { href: getContactFallbackHref(), external: false };
}

// Server component. Centred wrapping row: 1 per row on phones, 2 from sm, 3 from lg (3 + 2), 5 from xl.
// Each card is sized from the gap so the last, shorter row sits in the middle.
export default async function WhoItsFor() {
  const [audiences, copy] = await Promise.all([getAudiences(), getHomeCopy()]);
  if (audiences.length === 0) return null;

  return (
    <Section id="who" labelledBy="who-title" decoration="circles">
      <Reveal>
        <SectionHeading id="who-title" intro={copy.whoItsFor.intro}>
          {copy.whoItsFor.heading}
        </SectionHeading>
      </Reveal>
      <ul className="mt-10 flex flex-wrap items-start justify-center gap-4 [--aud-gap:1rem] lg:gap-6 lg:[--aud-gap:1.5rem]">
        {audiences.map((a, i) => {
          const { href, external } = resolveCta(a);
          return (
            <Reveal
              as="li"
              key={a.id}
              index={i}
              className="w-full sm:w-[calc((100%-var(--aud-gap))/2)] lg:w-[calc((100%-2*var(--aud-gap))/3)] xl:w-[calc((100%-4*var(--aud-gap))/5)]"
            >
              <AudienceCard audience={a} href={href} external={external} />
            </Reveal>
          );
        })}
      </ul>
    </Section>
  );
}
