import { ArrowLeft, FolderSimple } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import CategoryManager from "@/components/admin/CategoryManager";
import EmptyState from "@/components/admin/EmptyState";
import UnavailableNotice from "@/components/admin/UnavailableNotice";
import { createBlogCategory, deleteBlogCategory, setBlogCategoryOrder, updateBlogCategory } from "@/lib/admin/blog-categories-actions";
import { listAdminBlogCategories } from "@/lib/admin/blog-read";
import { safeLoad } from "@/lib/admin/safe-load";
import { requireAdmin } from "@/lib/admin/session";

export const metadata = { title: "Blog categories" };

export default async function BlogCategoriesPage() {
  await requireAdmin();
  const loaded = await safeLoad(listAdminBlogCategories);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/blog"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-midnight underline underline-offset-4"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Blog
        </Link>
        <h1 className="mt-1 font-heading text-2xl font-bold text-midnight">Blog categories</h1>
        <p className="mt-1 text-sm text-midnight/75">Categories group posts on the Blog page. A post needs one before it can be published.</p>
      </div>
      {!loaded.ok ? (
        <UnavailableNotice />
      ) : (
        <>
          <CategoryManager
            categories={loaded.data}
            actions={{ create: createBlogCategory, update: updateBlogCategory, setOrder: setBlogCategoryOrder, remove: deleteBlogCategory }}
            noun={["post", "posts"]}
            basePath="/blog"
            withDescription={false}
          />
          {loaded.data.length === 0 ? (
            <EmptyState icon={FolderSimple} title="No categories yet.">
              Create one to start publishing posts.
            </EmptyState>
          ) : null}
        </>
      )}
    </div>
  );
}
