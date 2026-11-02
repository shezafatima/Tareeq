import type { Metadata } from "next";
import ContactItem from "@/components/sections/ContactItem";
import CtaBand from "@/components/sections/CtaBand";
import PageHeader from "@/components/sections/PageHeader";
import Section from "@/components/sections/Section";
import Reveal from "@/components/ui/Reveal";
import { getContactCta, getContactDetails, getContactEmpty, getContactNote, getPageMeta } from "@/content";
import { getWhatsAppUrl } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const { title, description } = await getPageMeta("contact");
  return { title, description };
}

export default async function ContactPage() {
  const [details, note, cta, meta, empty] = await Promise.all([
    getContactDetails(),
    getContactNote(),
    getContactCta(),
    getPageMeta("contact"),
    getContactEmpty(),
  ]);
  const whatsapp = getWhatsAppUrl();

  return (
    <>
      <PageHeader eyebrow={meta.eyebrow} intro={meta.intro}>
        {meta.heading}
      </PageHeader>
      <Section labelledBy="contact-details-title" tone="soft" divider>
        <h2 id="contact-details-title" className="sr-only">
          Contact details
        </h2>
        {details.length > 0 ? (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {details.map((d, i) => (
              <Reveal as="li" key={d.kind} index={i} className="h-full">
                <ContactItem detail={d} />
              </Reveal>
            ))}
          </ul>
        ) : (
          <p className="max-w-prose text-lg text-midnight/85">{empty}</p>
        )}
        {details.length > 0 && (
          <Reveal className="mt-8" index={details.length}>
            <p className="max-w-prose text-base text-midnight/80">{note}</p>
          </Reveal>
        )}
      </Section>
      {whatsapp && <CtaBand line={cta.line} label={cta.label} href={whatsapp} external />}
    </>
  );
}
