import { CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { leadsHref, type LeadParams } from "@/lib/admin/leads-params";
import { cn } from "@/lib/utils";

const btn =
  "inline-flex min-h-11 items-center gap-1 rounded-full border border-midnight/70 px-4 text-sm font-semibold text-midnight hover:bg-midnight/5";
const off = "pointer-events-none opacity-40";

/** Previous / next with "Page X of Y", keeping the current filters. 25 per page. */
export default function Pagination({
  page,
  pages,
  total,
  params,
}: {
  page: number;
  pages: number;
  total: number;
  params: LeadParams;
}) {
  const to = (p: number) => leadsHref({ ...params, page: p, lead: null });
  return (
    <nav aria-label="Pages" className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-midnight/80">
        Page {page} of {pages} · {total} {total === 1 ? "submission" : "submissions"}
      </p>
      <div className="flex gap-2">
        <Link
          href={to(page - 1)}
          aria-disabled={page <= 1}
          tabIndex={page <= 1 ? -1 : undefined}
          className={cn(btn, page <= 1 && off)}
        >
          <CaretLeft aria-hidden="true" size={16} /> Previous
        </Link>
        <Link
          href={to(page + 1)}
          aria-disabled={page >= pages}
          tabIndex={page >= pages ? -1 : undefined}
          className={cn(btn, page >= pages && off)}
        >
          Next <CaretRight aria-hidden="true" size={16} />
        </Link>
      </div>
    </nav>
  );
}
