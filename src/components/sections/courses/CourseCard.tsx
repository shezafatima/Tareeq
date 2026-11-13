import Link from "next/link";
import ProgramCover from "@/components/sections/programs/ProgramCover";
import PriceBlock from "@/components/ui/PriceBlock";
import { FORMAT_LABELS, LEVEL_LABELS, type CourseCardData } from "@/lib/courses/options";
import { resolvePrice } from "@/lib/pricing/rules";
import { resolveCover } from "@/lib/programs/view";
import CourseStatusChip from "./CourseStatusChip";

type CourseCardProps = {
  course: CourseCardData;
  headingLevel?: "h2" | "h3";
  /** what the cover takes up at each width, for next/image */
  sizes?: string;
};

/**
 * One course on /courses. Presentational only (no client code, no server-only imports), so the admin live preview renders
 * this same component. Coming-soon cards are muted through CSS on [data-status]; they stay links.
 */
export default function CourseCard({
  course,
  headingLevel: Heading = "h2",
  sizes = "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw",
}: CourseCardProps) {
  const meta = [LEVEL_LABELS[course.level], FORMAT_LABELS[course.format], course.durationText.trim()].filter(Boolean);
  const price = resolvePrice(course.pricing, course.priceText);
  return (
    <Link
      href={`/courses/${course.slug}`}
      data-status={course.enrollmentStatus}
      className="course-card group flex h-full flex-col overflow-hidden rounded-card bg-white text-midnight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal"
    >
      <ProgramCover cover={resolveCover(course)} sizes={sizes} className="course-card-cover relative aspect-[16/9] w-full" />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {course.category ? (
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-royal">{course.category.name}</p>
          ) : (
            <span />
          )}
          <CourseStatusChip status={course.enrollmentStatus} />
        </div>
        <Heading className="font-heading text-xl font-bold leading-snug text-midnight group-hover:underline group-hover:underline-offset-4">
          {course.title}
        </Heading>
        {course.summary ? <p className="line-clamp-2 text-base text-midnight/80">{course.summary}</p> : null}
        <p className="mt-auto pt-1 text-sm text-midnight/75">{meta.join(" · ")}</p>
        {price.kind !== "none" ? <PriceBlock price={price} size="sm" className="border-t border-midnight/10 pt-3" /> : null}
      </div>
    </Link>
  );
}
