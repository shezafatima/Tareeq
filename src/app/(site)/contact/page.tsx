import type { Metadata } from "next";
import ContactItem from "@/components/sections/ContactItem";
import CtaBand from "@/components/sections/CtaBand";
import PageHeader from "@/components/sections/PageHeader";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Section from "@/components/sections/Section";
import Reveal from "@/components/ui/Reveal";
import { getContactCta, getContactDetails, getContactEmpty, getContactNote, getCourseFormLabel, getPageMeta } from "@/content";
import { getWhatsAppUrl, joinHref } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const { title, description } = await getPageMeta("contact");
  return { title, description };
}

export default async function ContactPage() {
  const [details, note, cta, meta, empty, courseLabel] = await Promise.all([
    getContactDetails(),
    getContactNote(),
    getContactCta(),
    getPageMeta("contact"),
    getContactEmpty(),
    getCourseFormLabel(),
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
      {/* DRAFT: owner to confirm the wording. The workshop card comes first and is the more prominent. */}
      <Section labelledBy="contact-forms-title">
        <h2 id="contact-forms-title" className="font-heading text-2xl font-bold text-midnight">
          Book a workshop or join a course waitlist
        </h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <Card className="flex h-full flex-col items-start">
            <h3 className="font-heading text-xl font-bold text-midnight">Workshop for your school</h3>
            <p className="mt-2 text-base text-midnight/85">Tell us about your school and we will agree a date and format with you.</p>
            <Button href={joinHref} className="mt-5">
              Book a workshop
            </Button>
          </Card>
          <Card className="flex h-full flex-col items-start">
            <h3 className="font-heading text-xl font-bold text-midnight">Online courses</h3>
            <p className="mt-2 text-base text-midnight/85">Leave your details and we will WhatsApp you when a course opens.</p>
            <Button href="/register" variant="secondary" className="mt-5">
              {courseLabel}
            </Button>
          </Card>
        </div>
      </Section>
      {whatsapp && <CtaBand line={cta.line} label={cta.label} href={whatsapp} external />}
    </>
  );
}
