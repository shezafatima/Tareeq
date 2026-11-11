import ProgramCover from "@/components/sections/programs/ProgramCover";
import Container from "@/components/ui/Container";
import { LEVEL_LABELS, type Course } from "@/lib/courses/options";
import { isAllowedCover } from "@/lib/programs/view";
import CourseStatusChip from "./CourseStatusChip";

/** Top of a course page: category, level, status, title and summary over the cover or brand pattern. Holds the only h1. */
export default function CourseHeader({ course }: { course: Course }) {
  return (
    <header className="relative isolate overflow-hidden bg-midnight text-white">
      <ProgramCover url={course.coverImageUrl} sizes="100vw" priority className="absolute inset-0 -z-10" />
      {isAllowedCover(course.coverImageUrl) && <div aria-hidden="true" className="absolute inset-0 -z-10 bg-midnight/70" />}
      <Container className="flex min-h-[22rem] flex-col justify-end gap-5 pb-10 pt-16 lg:min-h-[30rem] lg:pb-16">
        <div className="page-enter flex flex-wrap items-center gap-3">
          {course.category && (
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/90">{course.category.name}</p>
          )}
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/90">{LEVEL_LABELS[course.level]}</p>
          <CourseStatusChip status={course.enrollmentStatus} />
        </div>
        <h1 className="program-detail-title page-enter-h1 max-w-4xl font-heading font-bold">{course.title}</h1>
        <p className="page-enter max-w-2xl text-lg text-white/90 lg:text-xl" style={{ "--d": 1 } as React.CSSProperties}>
          {course.summary}
        </p>
      </Container>
    </header>
  );
}
