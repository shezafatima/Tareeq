"use client"; // renders from the form's live state, so it re-renders on every keystroke

import CourseCard from "@/components/sections/courses/CourseCard";
import type { CourseFormValues } from "@/lib/admin/courses-schema";
import type { CourseCardData } from "@/lib/courses/options";

type Category = { id: string; name: string; slug: string };

function toCardData(v: CourseFormValues, categories: Category[]): CourseCardData {
  const category = categories.find((c) => c.id === v.category);
  const cover = v.coverImageUrl.trim();
  return {
    title: v.title.trim() || "Course title",
    slug: v.slug.trim() || "course-slug",
    category: category ? { name: category.name, slug: category.slug } : null,
    level: v.level,
    format: v.format,
    durationText: v.durationText,
    enrollmentStatus: v.enrollmentStatus,
    priceText: v.priceText,
    summary: v.summary.trim() || "A short summary of the course appears here.",
    ...(cover ? { coverImageUrl: cover } : {}),
  };
}

/**
 * How the course will look on the public Courses page: the public CourseCard itself, fed by the form.
 * `inert` keeps its link from being clickable or focusable.
 */
export default function CoursePreview({ values, categories }: { values: CourseFormValues; categories: Category[] }) {
  return (
    <section aria-label="Preview of the public Courses page">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-midnight/70">Preview</p>
      <div className="max-w-sm rounded-2xl bg-paper p-4 ring-1 ring-midnight/10" inert>
        <CourseCard course={toCardData(values, categories)} sizes="24rem" />
      </div>
      {!values.published ? <p className="mt-2 text-xs text-midnight/70">Hidden: tick Published to show it on the site.</p> : null}
    </section>
  );
}
