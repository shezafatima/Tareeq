"use client"; // reads and updates the address (?for=), and handles chip presses

import { useLayoutEffect, useSyncExternalStore } from "react";
import { FILTER_LABELS, FILTER_VALUES, type FilterValue } from "@/lib/programs/options";
import { parseFilter } from "@/lib/programs/view";

type ProgramFilterProps = {
  /** id of the server-rendered list this filter controls */
  listId: string;
  /** how many programs each filter shows */
  counts: Record<FilterValue, number>;
};

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("popstate", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("popstate", listener);
  };
}

const getFilter = () => parseFilter(window.location.search);
const getServerFilter = (): FilterValue => "all";

function setFilter(value: FilterValue) {
  const url = new URL(window.location.href);
  if (value === "all") url.searchParams.delete("for");
  else url.searchParams.set("for", value);
  window.history.replaceState(null, "", url);
  listeners.forEach((listener) => listener());
}

/**
 * Audience chips for /programs. Only sets data-active on the list; CSS hides, numbers and alternates the panels,
 * so the server-rendered panels never re-render. See specs/015-programs-pages/research.md R3.
 */
export default function ProgramFilter({ listId, counts }: ProgramFilterProps) {
  const active = useSyncExternalStore(subscribe, getFilter, getServerFilter);
  const count = counts[active];

  useLayoutEffect(() => {
    const list = document.getElementById(listId);
    if (!list) return;
    if (active === "all") {
      list.removeAttribute("data-active");
      return;
    }
    list.setAttribute("data-active", active);
    // once someone has filtered, panels appear at once rather than fading in as they are shown again
    list.querySelectorAll("li:not([data-revealed])").forEach((li) => li.setAttribute("data-revealed", "instant"));
  }, [active, listId]);

  return (
    <div className="program-filter mt-8 lg:mt-10">
      <div role="group" aria-label="Filter programs by audience" className="flex flex-wrap gap-2">
        {FILTER_VALUES.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={active === value}
            onClick={() => setFilter(value)}
            className="min-h-11 rounded-pill border border-midnight/30 px-5 text-sm font-semibold text-midnight transition-colors duration-[var(--dur-fast)] hover:bg-midnight/5 aria-pressed:border-midnight aria-pressed:bg-midnight aria-pressed:text-white"
          >
            {FILTER_LABELS[value]}
          </button>
        ))}
      </div>
      <p role="status" className="sr-only">
        {count === 1 ? "1 program" : `${count} programs`}
      </p>
      {count === 0 && (
        <p className="mt-6 text-base text-midnight">
          Nothing for this group yet.{" "}
          <button
            type="button"
            onClick={() => setFilter("all")}
            className="inline-flex min-h-11 items-center font-semibold text-royal underline underline-offset-4"
          >
            Show all programs
          </button>
        </p>
      )}
    </div>
  );
}
