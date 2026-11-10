"use client"; // needs state and the router (search is debounced and every control writes the filters into the address)

import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { leadsHref, type LeadParams } from "@/lib/admin/leads-params";
import { controlBase, controlBorder } from "@/components/ui/FieldFrame";
import { cn } from "@/lib/utils";

const TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "workshop", label: "Workshop requests" },
  { value: "course", label: "Course sign-ups" },
];
const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "booked", label: "Booked" },
  { value: "closed", label: "Closed" },
];

/** Type, status and search. They live in the address, so a refresh keeps the view. Changing any of them returns to page 1. */
export default function FilterBar({ params }: { params: LeadParams }) {
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
      router.replace(leadsHref({ ...latest.current, q: q.trim(), page: 1, lead: null }), { scroll: false });
    }, 350);
    return () => window.clearTimeout(timer);
  }, [q, router]);

  const go = (next: Partial<LeadParams>) =>
    router.replace(leadsHref({ ...params, q: q.trim(), ...next, page: 1, lead: null }), { scroll: false });

  const filtered = Boolean(params.type || params.status || params.q);
  const select = cn(controlBase, controlBorder(), "mt-0 pl-3 pr-8");

  return (
    <form role="search" onSubmit={(e) => e.preventDefault()} className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
      <div>
        <label htmlFor="lead-search" className="sr-only">
          Search by name, phone, email or organization
        </label>
        <div className="relative">
          <MagnifyingGlass aria-hidden="true" size={20} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-midnight/60" />
          <input
            id="lead-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            maxLength={100}
            placeholder="Search submissions"
            className={cn(controlBase, controlBorder(), "mt-0 pl-11")}
          />
        </div>
      </div>
      <div>
        <label htmlFor="lead-type" className="sr-only">
          Type
        </label>
        <select
          id="lead-type"
          value={params.type ?? ""}
          onChange={(e) => go({ type: (e.target.value || null) as LeadParams["type"] })}
          className={select}
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="lead-status" className="sr-only">
          Status
        </label>
        <select
          id="lead-status"
          value={params.status ?? ""}
          onChange={(e) => go({ status: (e.target.value || null) as LeadParams["status"] })}
          className={select}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      {filtered ? (
        <p className="sm:col-span-3">
          <Link
            href="/admin"
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
