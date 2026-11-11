import { ArrowLeft, FolderSimple } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import CategoryManager from "@/components/admin/CategoryManager";
import EmptyState from "@/components/admin/EmptyState";
import UnavailableNotice from "@/components/admin/UnavailableNotice";
import { listAllCategories } from "@/lib/admin/courses-read";
import { safeLoad } from "@/lib/admin/safe-load";
import { requireAdmin } from "@/lib/admin/session";

export const metadata = { title: "Course categories" };

export default async function CourseCategoriesPage() {
  await requireAdmin();
  const loaded = await safeLoad(listAllCategories);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/courses"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-midnight underline underline-offset-4"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Courses
        </Link>
        <h1 className="mt-1 font-heading text-2xl font-bold text-midnight">Course categories</h1>
        <p className="mt-1 text-sm text-midnight/75">Categories group courses on the Courses page and in the register form.</p>
      </div>
      {!loaded.ok ? (
        <UnavailableNotice />
      ) : (
        <>
          <CategoryManager categories={loaded.data} />
          {loaded.data.length === 0 ? (
            <EmptyState icon={FolderSimple} title="No categories yet.">
              Create one to start adding courses.
            </EmptyState>
          ) : null}
        </>
      )}
    </div>
  );
}
