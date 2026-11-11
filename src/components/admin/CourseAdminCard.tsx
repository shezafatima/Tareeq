import { PencilSimple } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { setCoursePublished } from "@/lib/admin/courses-actions";
import type { AdminCourse } from "@/lib/admin/courses-read";
import { ENROLLMENT_LABELS, LEVEL_LABELS, type EnrollmentStatus } from "@/lib/courses/options";
import FeaturedToggle from "./FeaturedToggle";
import PublishedToggle from "./PublishedToggle";
import StatusChip, { type ChipTone } from "./StatusChip";

const STATUS_TONE: Record<EnrollmentStatus, ChipTone> = {
  open: "royal",
  "coming-soon": "sky",
  closed: "grey",
};

/** One course in the admin grid: category, level, status, the instant published switch, the featured star and an edit link. */
export default function CourseAdminCard({ course }: { course: AdminCourse }) {
  return (
    <article className="flex h-full flex-col rounded-2xl bg-soft p-5 shadow-sm ring-1 ring-midnight/10">
      <div className="flex items-start justify-between gap-3">
        {course.category ? (
          <p className="text-xs font-semibold uppercase tracking-wide text-midnight/80">{course.category.name}</p>
        ) : (
          <StatusChip label="No category" tone="saffron" />
        )}
        <StatusChip label={ENROLLMENT_LABELS[course.enrollmentStatus]} tone={STATUS_TONE[course.enrollmentStatus]} />
      </div>
      <div className="mt-3 flex items-start justify-between gap-2">
        <h2 className="font-heading text-lg font-bold text-midnight">{course.title}</h2>
        <FeaturedToggle id={course.id} title={course.title} featured={course.featured} />
      </div>
      <p className="text-sm font-medium text-midnight/80">{LEVEL_LABELS[course.level]}</p>
      <p className="mt-1 line-clamp-2 text-sm text-midnight/80">{course.summary}</p>
      <p className="mt-2 break-all text-xs text-midnight/70">
        /courses/{course.slug} · order {course.order}
      </p>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4">
        <PublishedToggle id={course.id} title={course.title} published={course.published} action={setCoursePublished} />
        <Link
          href={`/admin/courses/${course.id}/edit`}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-midnight/70 bg-white px-4 text-sm font-semibold text-midnight hover:bg-midnight/5"
        >
          <PencilSimple weight="duotone" size={18} aria-hidden="true" />
          Edit
          <span className="sr-only"> {course.title}</span>
        </Link>
      </div>
    </article>
  );
}
