import { notFound } from "next/navigation";
import CourseEditor from "@/components/admin/CourseEditor";
import UnavailableNotice from "@/components/admin/UnavailableNotice";
import { getCourseById, listAllCategories, type AdminCourse } from "@/lib/admin/courses-read";
import type { CourseFormValues } from "@/lib/admin/courses-schema";
import { toPricingFormValues } from "@/lib/pricing/rules";
import { safeLoad } from "@/lib/admin/safe-load";
import { requireAdmin } from "@/lib/admin/session";

export const metadata = { title: "Edit course" };

function toFormValues(c: AdminCourse): CourseFormValues {
  return {
    title: c.title,
    slug: c.slug,
    // a course whose category was removed shows an empty choice, so the owner has to pick one before saving
    category: c.category ? c.categoryId : "",
    level: c.level,
    format: c.format,
    enrollmentStatus: c.enrollmentStatus,
    summary: c.summary,
    description: c.description,
    outcomes: c.outcomes.length ? c.outcomes : [""],
    syllabus: c.syllabus,
    durationText: c.durationText,
    startDateText: c.startDateText,
    priceText: c.priceText,
    pricing: toPricingFormValues(c.pricing),
    coverImageUrl: c.coverImageUrl ?? "",
    coverImage: c.coverImage ?? null,
    featured: c.featured,
    order: String(c.order),
    published: c.published,
  };
}

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const loaded = await safeLoad(() => Promise.all([getCourseById(id), listAllCategories()]));

  if (!loaded.ok) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold text-midnight">Edit course</h1>
        <UnavailableNotice />
      </div>
    );
  }
  const [course, categories] = loaded.data;
  if (!course) notFound();

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-midnight">Edit course</h1>
      <CourseEditor
        mode="edit"
        id={course.id}
        initial={toFormValues(course)}
        categories={categories.map(({ id: cid, name, slug }) => ({ id: cid, name, slug }))}
      />
    </div>
  );
}
