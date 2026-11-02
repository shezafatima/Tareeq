import type { Metadata } from "next";
import CtaBand from "@/components/sections/CtaBand";
import PageHeader from "@/components/sections/PageHeader";
import ProgramCard from "@/components/sections/ProgramCard";
import Section from "@/components/sections/Section";
import Reveal from "@/components/ui/Reveal";
import { getHomeCopy, getPageMeta, getPrograms } from "@/content";
import { getWhatsAppUrl } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const { title, description } = await getPageMeta("programs");
  return { title, description };
}

export default async function ProgramsPage() {
  const [programs, { cta }, meta] = await Promise.all([getPrograms(), getHomeCopy(), getPageMeta("programs")]);
  const askHref = getWhatsAppUrl();

  return (
    <>
      <PageHeader eyebrow={meta.eyebrow} intro={meta.intro}>
        {meta.heading}
      </PageHeader>
      <Section labelledBy="programs-list-title" tone="soft" divider>
        <h2 id="programs-list-title" className="sr-only">
          All programs
        </h2>
        <ul className="grid gap-6 lg:grid-cols-3">
          {programs.map((p, i) => (
            <Reveal as="li" key={p.id} index={i} className="h-full">
              <ProgramCard program={p} variant="full" joinHref={cta.href} askHref={askHref} />
            </Reveal>
          ))}
        </ul>
      </Section>
      <CtaBand line={cta.line} label={cta.label} href={cta.href} />
    </>
  );
}
