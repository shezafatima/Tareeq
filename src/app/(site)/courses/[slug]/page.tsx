import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CourseCtaCard from "@/components/sections/courses/CourseCtaCard";
import CourseHeader from "@/components/sections/courses/CourseHeader";
import CourseMobileCtaBar from "@/components/sections/courses/CourseMobileCtaBar";
import CurriculumTimeline from "@/components/sections/programs/CurriculumTimeline";
import ProgramFacts from "@/components/sections/programs/ProgramFacts";
import ProgramOutcomes from "@/components/sections/programs/ProgramOutcomes";
import ProgramProse from "@/components/sections/programs/ProgramProse";
import Container from "@/components/ui/Container";
import { getCourseBySlug, getPublishedCourseSlugs } from "@/lib/courses/data";
import { courseFacts } from "@/lib/courses/view";
import { isAllowedCover } from "@/lib/programs/view";

// Static, refreshed hourly and by tag. See specs/025-courses-catalog/research.md R3 and R14.
export const revalidate = 3600;

type CoursePageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getPublishedCourseSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) return {};

  const image = isAllowedCover(course.coverImageUrl)
    ? { url: course.coverImageUrl, alt: course.title }
    : { url: "/robot.png", width: 408, height: 612, alt: "Tareeq robot assistant" };
  const path = `/courses/${course.slug}`;

  return {
    title: course.title,
    description: course.summary,
    alternates: { canonical: path },
    openGraph: {
      title: course.title,
      description: course.summary,
      type: "website",
      siteName: "Tareeq",
      url: path,
      images: [image],
    },
    twitter: { card: "summary", title: course.title, description: course.summary, images: [image.url] },
  };
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();
  const facts = courseFacts(course);

  return (
    <>
      <CourseHeader course={course} />
      <Container className="grid gap-10 py-section lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16 lg:py-16">
        <div className="grid min-w-0 content-start gap-10 lg:gap-14">
          <ProgramProse markdown={course.description} />
          <ProgramOutcomes outcomes={course.outcomes} />
          <CurriculumTimeline steps={course.syllabus} heading="Syllabus" />
          {facts.length > 0 && (
            <section aria-labelledby="course-facts">
              <h2 id="course-facts" className="font-heading text-2xl font-bold text-midnight lg:text-3xl">
                The details
              </h2>
              <ProgramFacts facts={facts} variant="grid" className="mt-5" />
            </section>
          )}
        </div>
        <div className="hidden lg:block">
          <CourseCtaCard course={course} />
        </div>
      </Container>
      <CourseMobileCtaBar course={course} />
    </>
  );
}
