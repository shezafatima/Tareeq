import { FolderSimple, GraduationCap, MagnifyingGlass, Plus } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import CourseAdminCard from "@/components/admin/CourseAdminCard";
import EmptyState from "@/components/admin/EmptyState";
import UnavailableNotice from "@/components/admin/UnavailableNotice";
import SelectField from "@/components/ui/SelectField";
import { listAllCategories, listAllCourses } from "@/lib/admin/courses-read";
import { safeLoad } from "@/lib/admin/safe-load";
import { requireAdmin } from "@/lib/admin/session";
import { ENROLLMENT_LABELS, ENROLLMENT_STATUSES, isEnrollmentStatus } from "@/lib/courses/options";

export const metadata = { title: "Courses" };

const darkButton =
  "inline-flex min-h-11 items-center gap-2 rounded-full bg-midnight px-5 text-sm font-semibold text-white hover:bg-royal";
const lightButton =
  "inline-flex min-h-11 items-center gap-2 rounded-full border border-midnight/70 bg-white px-5 text-sm font-semibold text-midnight hover:bg-midnight/5";

type Search = Promise<{ category?: string | string[]; status?: string | string[] }>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function CoursesAdminPage({ searchParams }: { searchParams: Search }) {
  await requireAdmin();
  const raw = await searchParams;
  const categories = await safeLoad(listAllCategories);
  const categoryId = categories.ok && categories.data.some((c) => c.id === first(raw.category)) ? first(raw.category) : "";
  const status = isEnrollmentStatus(first(raw.status)) ? first(raw.status) : "";
  const filtered = Boolean(categoryId || status);
  const courses = categories.ok ? await safeLoad(() => listAllCourses({ category: categoryId, status })) : categories;

  const hasCategories = categories.ok && categories.data.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold text-midnight">Courses</h1>
        {categories.ok ? (
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/courses/categories" className={lightButton}>
              <FolderSimple weight="duotone" size={18} aria-hidden="true" />
              Categories
            </Link>
            {hasCategories ? (
              <Link href="/admin/courses/new" className={darkButton}>
                <Plus weight="bold" size={16} aria-hidden="true" />
                New course
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>

      {!categories.ok || !courses.ok ? (
        <UnavailableNotice />
      ) : !hasCategories ? (
        <EmptyState icon={FolderSimple} title="Create a category first.">
          Every course belongs to a category.{" "}
          <Link href="/admin/courses/categories" className="font-semibold text-royal underline underline-offset-4">
            Add a category
          </Link>
        </EmptyState>
      ) : (
        <>
          {/* a plain GET form: works without JavaScript, and the filters live in the address */}
          <form method="get" className="grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-midnight/10 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <SelectField
              label="Category"
              name="category"
              defaultValue={categoryId}
              options={[{ value: "", label: "All categories" }, ...categories.data.map((c) => ({ value: c.id, label: c.name }))]}
            />
            <SelectField
              label="Status"
              name="status"
              defaultValue={status}
              options={[{ value: "", label: "All statuses" }, ...ENROLLMENT_STATUSES.map((s) => ({ value: s, label: ENROLLMENT_LABELS[s] }))]}
            />
            <div className="flex flex-wrap items-center gap-2">
              <button type="submit" className={darkButton}>
                Apply
              </button>
              {filtered ? (
                <Link href="/admin/courses" className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-midnight underline underline-offset-4">
                  Clear filters
                </Link>
              ) : null}
            </div>
          </form>

          {courses.data.length === 0 ? (
            filtered ? (
              <EmptyState icon={MagnifyingGlass} title="No courses match these filters.">
                <Link href="/admin/courses" className="font-semibold text-royal underline underline-offset-4">
                  Clear filters
                </Link>
              </EmptyState>
            ) : (
              <EmptyState icon={GraduationCap} title="No courses yet.">
                Create the first one and publish it to show it on the Courses page.
              </EmptyState>
            )
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {courses.data.map((course) => (
                <li key={course.id}>
                  <CourseAdminCard course={course} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
