import { Article, FolderSimple, Plus } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import BlogPostRow from "@/components/admin/BlogPostRow";
import EmptyState from "@/components/admin/EmptyState";
import FilterBar from "@/components/admin/FilterBar";
import UnavailableNotice from "@/components/admin/UnavailableNotice";
import { listAdminBlogCategories, listAdminPosts } from "@/lib/admin/blog-read";
import { isObjectId, listHref, SEARCH_MAX } from "@/lib/admin/leads-params";
import { safeLoad } from "@/lib/admin/safe-load";
import { requireAdmin } from "@/lib/admin/session";

export const metadata = { title: "Blog" };

const BLOG_PATH = "/admin/blog";
const FILTER_KEYS = ["status", "category", "q"] as const;

const darkButton =
  "inline-flex min-h-11 items-center gap-2 rounded-full bg-midnight px-5 text-sm font-semibold text-white hover:bg-royal";
const lightButton =
  "inline-flex min-h-11 items-center gap-2 rounded-full border border-midnight/70 bg-white px-5 text-sm font-semibold text-midnight hover:bg-midnight/5";

type Search = Promise<{ status?: string | string[]; category?: string | string[]; q?: string | string[] }>;
const first = (v: string | string[] | undefined): string => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function BlogAdminPage({ searchParams }: { searchParams: Search }) {
  await requireAdmin();
  const raw = await searchParams;
  const status = first(raw.status) === "draft" || first(raw.status) === "published" ? (first(raw.status) as "draft" | "published") : null;
  const category = isObjectId(first(raw.category)) ? first(raw.category) : null;
  const q = first(raw.q).trim().slice(0, SEARCH_MAX);
  const filtered = Boolean(status || category || q);

  const loaded = await safeLoad(() => Promise.all([listAdminPosts({ status, category, q }), listAdminBlogCategories()]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold text-midnight">Blog</h1>
        {loaded.ok ? (
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/blog/categories" className={lightButton}>
              <FolderSimple weight="duotone" size={18} aria-hidden="true" />
              Categories
            </Link>
            <Link href="/admin/blog/new" className={darkButton}>
              <Plus weight="bold" size={16} aria-hidden="true" />
              New post
            </Link>
          </div>
        ) : null}
      </div>

      {!loaded.ok ? (
        <UnavailableNotice />
      ) : (
        <>
          {/* the filters stay visible even when they match nothing, so they can be changed or cleared */}
          {loaded.data[0].length > 0 || filtered ? (
            <FilterBar
              basePath={BLOG_PATH}
              keys={FILTER_KEYS}
              params={{ status, category, q }}
              searchLabel="Search posts by title"
              selects={[
                { name: "status", label: "Status", allLabel: "All statuses", options: [{ value: "draft", label: "Draft" }, { value: "published", label: "Published" }] },
                { name: "category", label: "Category", allLabel: "All categories", options: loaded.data[1].map((c) => ({ value: c.id, label: c.name })) },
              ]}
            />
          ) : null}

          {loaded.data[0].length > 0 ? (
            <ul className="divide-y divide-midnight/10 overflow-hidden rounded-2xl bg-white ring-1 ring-midnight/10">
              {loaded.data[0].map((post) => (
                <BlogPostRow key={post.id} post={post} />
              ))}
            </ul>
          ) : filtered ? (
            <EmptyState icon={Article} title="No posts match these filters.">
              <Link href={listHref(BLOG_PATH, FILTER_KEYS, {})} className="font-semibold text-royal underline underline-offset-4">
                Clear filters
              </Link>
            </EmptyState>
          ) : (
            <EmptyState icon={Article} title="Write your first post.">
              {loaded.data[1].length === 0 ? (
                <>
                  Posts belong to a category.{" "}
                  <Link href="/admin/blog/categories" className="font-semibold text-royal underline underline-offset-4">
                    Create a category first
                  </Link>
                  , then{" "}
                </>
              ) : (
                "Start with "
              )}
              <Link href="/admin/blog/new" className="font-semibold text-royal underline underline-offset-4">
                a new post
              </Link>
              . Posts stay drafts until you publish them.
            </EmptyState>
          )}
        </>
      )}
    </div>
  );
}
