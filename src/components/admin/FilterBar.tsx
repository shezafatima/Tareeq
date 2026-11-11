"use client"; // needs state and the router (search is debounced and every control writes the filters into the address)

import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { leadsHref, type LeadParamsFor, type LeadType } from "@/lib/admin/leads-params";
import { controlBase, controlBorder } from "@/components/ui/FieldFrame";
import { cn } from "@/lib/utils";

export type FilterSelect = {
  /** the URL parameter this select writes, e.g. "status" or "category" */
  name: string;
  label: string;
  /** the first option, meaning "no filter", e.g. "All statuses" */
  allLabel: string;
  options: { value: string; label: string }[];
};

/**
 * Search plus one select per filter of this view (specs/026-split-submissions/contracts/routes-and-ui.md). They live in
 * the address, so a refresh or a shared link keeps the view. Changing any of them returns to page 1 and closes the drawer.
 */
export default function FilterBar<T extends LeadType>({
  type,
  params,
  selects,
  searchLabel,
}: {
  type: T;
  params: LeadParamsFor<T>;
  selects: FilterSelect[];
  searchLabel: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(params.q);
  const latest = useRef(params);
  useEffect(() => {
    latest.current = params;
  });

  // debounce typing; only push when the text really differs from what the address already holds
  useEffect(() => {
    if (q.trim() === latest.current.q) return;
    const timer = window.setTimeout(() => {
      router.replace(leadsHref(type, { ...latest.current, q: q.trim(), page: 1, lead: null }), { scroll: false });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [q, router, type]);

  const values = params as unknown as Record<string, string | null>;
  const go = (name: string, value: string) =>
    router.replace(leadsHref(type, { ...params, q: q.trim(), [name]: value || null, page: 1, lead: null }), { scroll: false });

  const filtered = Boolean(params.q) || selects.some((s) => Boolean(values[s.name]));
  const select = cn(controlBase, controlBorder(), "mt-0 pl-3 pr-8");

  return (
    <form role="search" onSubmit={(e) => e.preventDefault()} className="space-y-3">
      <div>
        <label htmlFor="lead-search" className="sr-only">
          {searchLabel}
        </label>
        <div className="relative">
          <MagnifyingGlass aria-hidden="true" size={20} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-midnight/60" />
          <input
            id="lead-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            maxLength={100}
            placeholder={searchLabel}
            className={cn(controlBase, controlBorder(), "mt-0 pl-11")}
          />
        </div>
      </div>
      <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3", selects.length > 3 && "xl:grid-cols-5")}>
        {selects.map((s) => (
          <div key={s.name} className="min-w-0">
            <label htmlFor={`lead-filter-${s.name}`} className="sr-only">
              {s.label}
            </label>
            <select
              id={`lead-filter-${s.name}`}
              value={values[s.name] ?? ""}
              onChange={(e) => go(s.name, e.target.value)}
              className={cn(select, "w-full truncate")}
            >
              <option value="">{s.allLabel}</option>
              {s.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      {filtered ? (
        <p>
          <Link
            href={leadsHref(type, {})}
            onClick={() => setQ("")}
            className="inline-flex min-h-11 items-center text-sm font-semibold text-royal underline underline-offset-4"
          >
            Clear filters
          </Link>
        </p>
      ) : null}
    </form>
  );
}
