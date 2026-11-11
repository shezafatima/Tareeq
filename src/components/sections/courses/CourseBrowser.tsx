import Link from "next/link";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import Reveal from "@/components/ui/Reveal";
import { LEVELS, type Course, type CourseCategory } from "@/lib/courses/options";
import { toCardData } from "@/lib/courses/view";
import { footerContactHref } from "@/lib/site";
import CourseCard from "./CourseCard";
import CourseFilter from "./CourseFilter";
import CourseFilterScript from "./CourseFilterScript";

const LIST_ID = "course-list";

type CourseBrowserProps = {
  heading: string;
  intro: string;
  /** listed courses (open or coming soon) in display order; null: they could not be read */
  courses: Course[] | null;
  categories: CourseCategory[];
  /** label of the register button in the empty state */
  registerLabel: string;
};

/** The /courses page body: heading, category and level chips, and the course cards. Holds the page's only h1. */
export default function CourseBrowser({ heading, intro, courses, categories, registerLabel }: CourseBrowserProps) {
  const used = new Set((courses ?? []).map((c) => c.category?.slug).filter(Boolean));
  const chips = categories.filter((c) => used.has(c.slug)).map(({ slug, name }) => ({ slug, name }));
  const levels = LEVELS.filter((l) => (courses ?? []).some((c) => c.level === l));
  const hasCourses = courses !== null && courses.length > 0;

  return (
    <>
      <Container as="header" className="pb-8 pt-12 lg:pb-12 lg:pt-20">
        <h1 className="program-hero-title page-enter-h1 font-heading font-bold text-midnight">{heading}</h1>
        <p className="page-enter mt-5 max-w-3xl text-lg text-midnight/85 lg:text-xl" style={{ "--d": 1 } as React.CSSProperties}>
          {intro}
        </p>
        {hasCourses && <CourseFilter listId={LIST_ID} categories={chips} levels={levels} />}
      </Container>

      {courses === null && (
        <Container className="pb-section lg:pb-16">
          <p className="max-w-2xl text-lg text-midnight">
            We can&apos;t show our courses right now. Please try again soon, or{" "}
            <Link href={footerContactHref} className="font-semibold text-royal underline underline-offset-4">
              contact us
            </Link>{" "}
            and we&apos;ll help you find the right one.
          </p>
        </Container>
      )}

      {courses !== null && courses.length === 0 && (
        <Container className="pb-section lg:pb-16">
          <div className="max-w-2xl rounded-card bg-soft p-6 sm:p-8">
            <h2 className="font-heading text-2xl font-bold text-midnight">Courses are coming soon</h2>
            <p className="mt-3 text-lg text-midnight/85">
              We&apos;re putting the first online courses together. Leave your details and we&apos;ll WhatsApp you when one opens.
            </p>
            <Button href="/register" size="lg" className="mt-6">
              {registerLabel}
            </Button>
          </div>
        </Container>
      )}

      {hasCourses && (
        <Container className="pb-section lg:pb-16">
          {/* hidden is set before hydration by CourseFilterScript */}
          <ul id={LIST_ID} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" suppressHydrationWarning>
            {courses.map((course, i) => (
              <Reveal as="li" key={course.slug} index={i} data-category={course.category?.slug ?? ""} data-level={course.level}>
                <CourseCard course={toCardData(course)} />
              </Reveal>
            ))}
          </ul>
          <CourseFilterScript listId={LIST_ID} categorySlugs={chips.map((c) => c.slug)} />
        </Container>
      )}
    </>
  );
}
