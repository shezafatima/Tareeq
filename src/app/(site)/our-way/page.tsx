import type { Metadata } from "next";
import CtaBand from "@/components/sections/CtaBand";
import PageHeader from "@/components/sections/PageHeader";
import StorySection from "@/components/sections/StorySection";
import { getHomeCopy, getPageMeta, getStorySections } from "@/content";

export async function generateMetadata(): Promise<Metadata> {
  const { title, description } = await getPageMeta("our-way");
  return { title, description };
}

export default async function OurWayPage() {
  const [sections, { cta }, meta] = await Promise.all([getStorySections(), getHomeCopy(), getPageMeta("our-way")]);

  return (
    <>
      <PageHeader eyebrow={meta.eyebrow} intro={meta.intro}>
        {meta.heading}
      </PageHeader>
      {sections.map((s, i) => (
        <StorySection key={s.id} section={s} tone={i % 2 === 1 ? "soft" : "paper"} divider={i > 0} />
      ))}
      <CtaBand line={cta.line} label={cta.label} href={cta.href} />
    </>
  );
}
