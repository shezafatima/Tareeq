import type { Metadata } from "next";
import CtaBand from "@/components/sections/CtaBand";
import ProgramBrowser from "@/components/sections/programs/ProgramBrowser";
import { getHomeCopy, getOnlineCoursesCard, getPageMeta } from "@/content";
import { loadPublishedPrograms } from "@/lib/programs/data";
import { getSiteSettings } from "@/lib/settings/data";
import { sortForIndex } from "@/lib/programs/view";

// Static, refreshed hourly and by tag. See specs/015-programs-pages/research.md R2.
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const { title, description } = await getPageMeta("programs");
  return { title, description };
}

export default async function ProgramsPage() {
  const [programs, { cta }, meta, onlineCourses, { whatsappNumber, email }] = await Promise.all([
    loadPublishedPrograms(),
    getHomeCopy(),
    getPageMeta("programs"),
    getOnlineCoursesCard(),
    getSiteSettings(),
  ]);

  return (
    <>
      <ProgramBrowser heading={meta.heading} intro={meta.intro} programs={programs && sortForIndex(programs)}
        contact={{ whatsappNumber, email }}
        onlineCourses={onlineCourses}
      />
      <CtaBand line={cta.line} label={cta.label} href={cta.href} />
    </>
  );
}
