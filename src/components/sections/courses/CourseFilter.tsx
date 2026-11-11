"use client"; // reads and updates the address (?category=&level=) and handles chip presses

import { useLayoutEffect, useSyncExternalStore } from "react";
import { LEVEL_LABELS, type Level } from "@/lib/courses/options";
import { parseCourseFilters } from "@/lib/courses/view";

type CourseFilterProps = {
  /** id of the server-rendered list this filter controls */
  listId: string;
  categories: { slug: string; name: string }[];
  levels: Level[];
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

const getSearch = () => window.location.search;
const getServerSearch = () => "";

function setParam(key: "category" | "level", value: string | null) {
  const url = new URL(window.location.href);
  if (value) url.searchParams.set(key, value);
  else url.searchParams.delete(key);
  window.history.replaceState(null, "", url);
  listeners.forEach((listener) => listener());
}

function clearAll() {
  const url = new URL(window.location.href);
  url.searchParams.delete("category");
  url.searchParams.delete("level");
  window.history.replaceState(null, "", url);
  listeners.forEach((listener) => listener());
}

const chip =
  "min-h-11 rounded-pill border border-midnight/30 px-5 text-sm font-semibold text-midnight transition-colors duration-[var(--dur-fast)] hover:bg-midnight/5 aria-pressed:border-midnight aria-pressed:bg-midnight aria-pressed:text-white";

/**
 * Category and level chips for /courses. Only toggles `hidden` on the server-rendered list items, so the cards never
 * re-render (research R7). Category slugs are data, so this sets attributes rather than relying on fixed CSS rules.
 */
export default function CourseFilter({ listId, categories, levels }: CourseFilterProps) {
  const search = useSyncExternalStore(subscribe, getSearch, getServerSearch);
  const { category, level } = parseCourseFilters(search, categories.map((c) => c.slug));
  const count = useSyncExternalStore(
    subscribe,
    () => countVisible(listId, category, level),
    () => -1,
  );

  useLayoutEffect(() => {
    const list = document.getElementById(listId);
    if (!list) return;
    for (const li of Array.from(list.children) as HTMLElement[]) {
      const show = (!category || li.dataset.category === category) && (!level || li.dataset.level === level);
      if (show) {
        // once someone has filtered, cards appear at once rather than fading in as they are shown again
        if (li.hidden && !li.hasAttribute("data-revealed")) li.setAttribute("data-revealed", "instant");
        li.hidden = false;
      } else {
        li.hidden = true;
      }
    }
    listeners.forEach((listener) => listener());
  }, [listId, category, level]);

  return (
    <div className="mt-8 space-y-4 lg:mt-10">
      <div role="group" aria-label="Filter courses by category" className="flex flex-wrap gap-2">
        <button type="button" aria-pressed={!category} onClick={() => setParam("category", null)} className={chip}>
          All topics
        </button>
        {categories.map((c) => (
          <button key={c.slug} type="button" aria-pressed={category === c.slug} onClick={() => setParam("category", c.slug)} className={chip}>
            {c.name}
          </button>
        ))}
      </div>
      {levels.length > 1 && (
        <div role="group" aria-label="Filter courses by level" className="flex flex-wrap gap-2">
          <button type="button" aria-pressed={!level} onClick={() => setParam("level", null)} className={chip}>
            All levels
          </button>
          {levels.map((l) => (
            <button key={l} type="button" aria-pressed={level === l} onClick={() => setParam("level", l)} className={chip}>
              {LEVEL_LABELS[l]}
            </button>
          ))}
        </div>
      )}
      <p role="status" className="sr-only">
        {count < 0 ? "" : count === 1 ? "1 course" : `${count} courses`}
      </p>
      {count === 0 && (
        <p className="text-base text-midnight">
          No courses match these filters.{" "}
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex min-h-11 items-center font-semibold text-royal underline underline-offset-4"
          >
            Show all courses
          </button>
        </p>
      )}
    </div>
  );
}

/** How many cards the current filters show; worked out from the data attributes so it never disagrees with the list. */
function countVisible(listId: string, category?: string, level?: string): number {
  const list = document.getElementById(listId);
  if (!list) return -1;
  return (Array.from(list.children) as HTMLElement[]).filter(
    (li) => (!category || li.dataset.category === category) && (!level || li.dataset.level === level),
  ).length;
}
