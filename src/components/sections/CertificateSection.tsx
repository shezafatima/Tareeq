import { Check } from "@phosphor-icons/react/dist/ssr";
import Section from "@/components/sections/Section";
import Reveal from "@/components/ui/Reveal";
import SafeImage from "@/components/ui/SafeImage";
import SectionHeading from "@/components/ui/SectionHeading";
import { SAMPLE_CERTIFICATE } from "@/lib/certificate/content";
import { getCertificate } from "@/lib/certificate/data";

/**
 * The certificate section on the home page, just before the final call to action (specs/034-pricing-certificate-announcement
 * FR-012..FR-016). Server component; the tilt and glow are CSS (.certificate-frame in globals.css). Content is admin-managed;
 * until an image is uploaded the built-in sample (with its "Sample" ribbon) is shown. Not rendered at all when switched off.
 */
export default async function CertificateSection() {
  const c = await getCertificate();
  if (!c.enabled) return null;

  // The wrapper clips sideways at the full-width band (the screen edge), so the tilt and the glow can never cause sideways
  // scrolling on a phone, and the glow fades out softly instead of ending at a visible box edge.
  return (
    <div className="overflow-x-clip">
      <Section id="certificate" labelledBy="certificate-title" tone="soft" divider>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="min-w-0">
            <Reveal>
              <SectionHeading id="certificate-title">{c.heading}</SectionHeading>
              <p className="mt-4 max-w-prose text-lg leading-relaxed text-midnight/80">{c.text}</p>
            </Reveal>
            <Reveal index={1}>
              <ul className="mt-6 space-y-3">
                {c.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3 text-base leading-relaxed text-midnight">
                    <Check aria-hidden="true" weight="bold" className="mt-1 size-5 shrink-0 text-royal" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
          <Reveal index={2} className="min-w-0 py-6">
            <div className="certificate-frame mx-auto max-w-xl rounded-card bg-white p-2 shadow-card-raised sm:p-3">
              <SafeImage
                src={c.image.src}
                alt={c.image.alt}
                width={c.image.width}
                height={c.image.height}
                fallbackSrc={SAMPLE_CERTIFICATE.src}
                fallbackWidth={SAMPLE_CERTIFICATE.width}
                fallbackHeight={SAMPLE_CERTIFICATE.height}
                fallbackAlt={SAMPLE_CERTIFICATE.alt}
                sizes="(min-width: 1024px) 40vw, 90vw"
                className="h-auto w-full rounded-control"
              />
            </div>
          </Reveal>
        </div>
      </Section>
    </div>
  );
}
