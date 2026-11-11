import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BookingCard from "@/components/sections/programs/BookingCard";
import CurriculumTimeline from "@/components/sections/programs/CurriculumTimeline";
import MobileCtaBar from "@/components/sections/programs/MobileCtaBar";
import ProgramFacts from "@/components/sections/programs/ProgramFacts";
import ProgramHeader from "@/components/sections/programs/ProgramHeader";
import ProgramOutcomes from "@/components/sections/programs/ProgramOutcomes";
import ProgramProse from "@/components/sections/programs/ProgramProse";
import Container from "@/components/ui/Container";
import { getProgramBySlug, getPublishedSlugs } from "@/lib/programs/data";
import { isAllowedCover, visibleFacts } from "@/lib/programs/view";
import { getSiteSettings } from "@/lib/settings/data";

// Static, refreshed hourly and by tag. See specs/015-programs-pages/research.md R2.
export const revalidate = 3600;

type ProgramPageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getPublishedSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ProgramPageProps): Promise<Metadata> {
  const { slug } = await params;
  const program = await getProgramBySlug(slug);
  if (!program) return {};

  const image = isAllowedCover(program.coverImageUrl)
    ? { url: program.coverImageUrl, alt: program.title }
    : { url: "/robot.png", width: 408, height: 612, alt: "Tareeq robot assistant" };
  const path = `/programs/${program.slug}`;

  return {
    title: program.title,
    description: program.summary,
    alternates: { canonical: path },
    openGraph: {
      title: program.title,
      description: program.summary,
      type: "website",
      siteName: "Tareeq",
      url: path,
      images: [image],
    },
    twitter: { card: "summary", title: program.title, description: program.summary, images: [image.url] },
  };
}

export default async function ProgramPage({ params }: ProgramPageProps) {
  const { slug } = await params;
  const [program, { whatsappNumber, email }] = await Promise.all([getProgramBySlug(slug), getSiteSettings()]);
  const contact = { whatsappNumber, email };
  if (!program) notFound();

  return (
    <>
      <ProgramHeader program={program} />
      <Container className="grid gap-10 py-section lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16 lg:py-16">
        <div className="grid min-w-0 content-start gap-10 lg:gap-14">
          <ProgramProse markdown={program.description} />
          <ProgramOutcomes outcomes={program.outcomes} />
          <CurriculumTimeline steps={program.curriculum} />
          {visibleFacts(program).length > 0 && (
            <section aria-labelledby="program-facts">
              <h2 id="program-facts" className="font-heading text-2xl font-bold text-midnight lg:text-3xl">
                The details
              </h2>
              <ProgramFacts facts={visibleFacts(program)} variant="grid" className="mt-5" />
            </section>
          )}
        </div>
        <div className="hidden lg:block">
          <BookingCard program={program} contact={contact} />
        </div>
      </Container>
      <MobileCtaBar program={program} contact={contact} />
    </>
  );
}
