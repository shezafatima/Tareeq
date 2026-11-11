import Link from "next/link";
import { LEAD_STATUS_VALUES, leadsHref, type LeadParamsFor, type LeadStatusValue, type LeadType } from "@/lib/admin/leads-params";
import type { StatusCounts } from "@/lib/admin/leads-query";
import { cn } from "@/lib/utils";
import CountUp from "./CountUp";
import { LEAD_STATUS_TONE } from "./StatusChip";

const DOT: Record<string, string> = {
  saffron: "bg-saffron",
  sky: "bg-sky",
  royal: "bg-royal",
  grey: "bg-midnight/40",
};

/**
 * Four cards, one per status, counting this view's type only. Each is a link that applies that status filter (clicking
 * the active one clears it). `labels` is the view's wording (courses say "Enrolled" for booked).
 */
export default function StatStrip<T extends LeadType>({
  type,
  counts,
  params,
  labels,
}: {
  type: T;
  counts: StatusCounts;
  params: LeadParamsFor<T>;
  labels: Record<LeadStatusValue, string>;
}) {
  return (
    <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="By status">
      {LEAD_STATUS_VALUES.map((status) => {
        const active = params.status === status;
        return (
          <li key={status}>
            <Link
              href={leadsHref(type, { ...params, status: active ? null : status, page: 1, lead: null })}
              aria-current={active ? "true" : undefined}
              className={cn(
                "block min-h-11 rounded-2xl p-4 shadow-sm ring-1 transition-[box-shadow,transform] duration-150 hover:shadow-md",
                active ? "bg-midnight text-white ring-midnight" : "bg-soft text-midnight ring-midnight/10",
              )}
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                <span aria-hidden="true" className={cn("size-2.5 rounded-full", DOT[LEAD_STATUS_TONE[status]])} />
                {labels[status]}
              </span>
              <CountUp value={counts[status]} className="mt-2 block font-heading text-3xl font-bold" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
