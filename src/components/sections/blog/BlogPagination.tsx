import { CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { blogHref, pageWindow } from "@/lib/blog/view";
import { cn } from "@/lib/utils";

const box = "inline-flex min-h-11 min-w-11 items-center justify-center rounded-pill px-3 text-sm font-semibold";
const outline = "border border-midnight/50 text-midnight hover:bg-midnight/5";

/** Previous, page numbers and next, keeping the active filters. Nothing is drawn for a single page. */
export default function BlogPagination({ page, pages, category, tag }: { page: number; pages: number; category: string | null; tag: string | null }) {
  if (pages <= 1) return null;
  const to = (n: number) => blogHref({ category, tag, page: n });
  return (
    <nav aria-label="Blog pages" className="flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={to(page - 1)} className={cn(box, outline, "gap-1")} rel="prev">
          <CaretLeft aria-hidden="true" size={16} /> Previous
        </Link>
      ) : (
        <span aria-disabled="true" className={cn(box, outline, "gap-1 opacity-40")}>
          <CaretLeft aria-hidden="true" size={16} /> Previous
        </span>
      )}
      <ul className="flex flex-wrap items-center gap-2">
        {pageWindow(page, pages).map((n, i) =>
          n === null ? (
            <li key={`gap-${i}`} aria-hidden="true" className="px-1 text-midnight/60">
              …
            </li>
          ) : (
            <li key={n}>
              <Link
                href={to(n)}
                aria-current={n === page ? "page" : undefined}
                aria-label={`Page ${n}`}
                className={cn(box, n === page ? "bg-midnight text-white" : outline)}
              >
                {n}
              </Link>
            </li>
          ),
        )}
      </ul>
      {page < pages ? (
        <Link href={to(page + 1)} className={cn(box, outline, "gap-1")} rel="next">
          Next <CaretRight aria-hidden="true" size={16} />
        </Link>
      ) : (
        <span aria-disabled="true" className={cn(box, outline, "gap-1 opacity-40")}>
          Next <CaretRight aria-hidden="true" size={16} />
        </span>
      )}
    </nav>
  );
}
