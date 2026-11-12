import Link from "next/link";
import { blogHref, type PublicCategory } from "@/lib/blog/view";
import { cn } from "@/lib/utils";

const chip = "inline-flex min-h-11 items-center rounded-pill px-4 text-sm font-semibold transition-colors motion-reduce:transition-none";

/**
 * Category chips ("All" plus each category that has posts) and the active tag, as plain links, so the filter lives in the address
 * (specs/033-admin-blog User Story 6). The chips wrap, so they never scroll the page sideways at 360px.
 */
export default function BlogFilterChips({ categories, category, tag }: { categories: PublicCategory[]; category: string | null; tag: string | null }) {
  if (categories.length === 0 && !tag) return null;
  return (
    <div className="space-y-3">
      {categories.length > 0 ? (
        <nav aria-label="Filter posts by category">
          <ul className="flex flex-wrap gap-2">
            <li>
              <Link
                href={blogHref({ tag })}
                aria-current={category ? undefined : "page"}
                className={cn(chip, category ? "border border-midnight/40 text-midnight hover:bg-midnight/5" : "bg-midnight text-white")}
              >
                All
              </Link>
            </li>
            {categories.map((c) => {
              const active = c.slug === category;
              return (
                <li key={c.slug}>
                  <Link
                    href={blogHref({ category: c.slug, tag })}
                    aria-current={active ? "page" : undefined}
                    className={cn(chip, active ? "bg-midnight text-white" : "border border-midnight/40 text-midnight hover:bg-midnight/5")}
                  >
                    {c.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
      {tag ? (
        <p className="flex flex-wrap items-center gap-3 text-sm text-midnight/85">
          <span className="font-semibold text-midnight">Tag: #{tag}</span>
          <Link href={blogHref({ category })} className="inline-flex min-h-11 items-center font-semibold text-royal underline underline-offset-4">
            Clear tag<span className="sr-only"> filter</span>
          </Link>
        </p>
      ) : null}
    </div>
  );
}
