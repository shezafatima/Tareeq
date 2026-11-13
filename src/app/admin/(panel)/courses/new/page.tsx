import { FolderSimple } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import CourseEditor from "@/components/admin/CourseEditor";
import EmptyState from "@/components/admin/EmptyState";
import UnavailableNotice from "@/components/admin/UnavailableNotice";
import { listAllCategories } from "@/lib/admin/courses-read";
import type { CourseFormValues } from "@/lib/admin/courses-schema";
import { EMPTY_PRICING } from "@/lib/pricing/rules";
import { safeLoad } from "@/lib/admin/safe-load";
import { requireAdmin } from "@/lib/admin/session";

export const metadata = { title: "New course" };

const empty = (category: string): CourseFormValues => ({
  title: "",
  slug: "",
  category,
  level: "beginner",
  format: "live",
  enrollmentStatus: "coming-soon",
  summary: "",
  description: "",
  outcomes: [""],
  syllabus: [],
  durationText: "",
  startDateText: "",
  priceText: "",
  pricing: EMPTY_PRICING,
  coverImageUrl: "",
  featured: false,
  order: "0",
  published: false,
});

export default async function NewCoursePage() {
  await requireAdmin();
  const loaded = await safeLoad(listAllCategories);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-midnight">New course</h1>
      {!loaded.ok ? (
        <UnavailableNotice />
      ) : loaded.data.length === 0 ? (
        <EmptyState icon={FolderSimple} title="Create a category first.">
          Every course belongs to a category.{" "}
          <Link href="/admin/courses/categories" className="font-semibold text-royal underline underline-offset-4">
            Add a category
          </Link>
        </EmptyState>
      ) : (
        <>
          <p className="max-w-2xl text-sm text-midnight/80">A new course stays hidden from the public site until you tick Published.</p>
          <CourseEditor
            mode="create"
            initial={empty(loaded.data[0].id)}
            categories={loaded.data.map(({ id, name, slug }) => ({ id, name, slug }))}
          />
        </>
      )}
    </div>
  );
}
