// URL parameters for the two Submissions views (specs/026-split-submissions/contracts/routes-and-ui.md). Pure: no server
// imports, so unit tests and client components can load it. The route decides the type; unknown values are ignored.

import { AGE_VALUES, LEVEL_VALUES, ROLE_VALUES } from "../leads/options.ts";

export const LEAD_TYPES = ["workshop", "course"] as const;
export const LEAD_STATUS_VALUES = ["new", "contacted", "booked", "closed"] as const;
export const PAGE_SIZE = 25;
export const SEARCH_MAX = 100;

export type LeadType = (typeof LEAD_TYPES)[number];
export type LeadStatusValue = (typeof LEAD_STATUS_VALUES)[number];

export const SUBMISSIONS_PATH: Record<LeadType, string> = {
  workshop: "/admin/submissions/workshops",
  course: "/admin/submissions/courses",
};

type Common = {
  status: LeadStatusValue | null;
  q: string;
  page: number;
  /** opaque ObjectId of the lead whose drawer is open */
  lead: string | null;
};

export type WorkshopParams = Common & {
  role: (typeof ROLE_VALUES)[number] | null;
  /** preferred month, YYYY-MM */
  month: string | null;
};

export type CourseParams = Common & {
  /** a course id, "not-sure", or a legacy id */
  course: string | null;
  /** a category id */
  category: string | null;
  level: (typeof LEVEL_VALUES)[number] | null;
  age: (typeof AGE_VALUES)[number] | null;
};

export type LeadParamsFor<T extends LeadType> = T extends "workshop" ? WorkshopParams : CourseParams;

type RawParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined): string => (Array.isArray(v) ? (v[0] ?? "") : (v ?? ""));

export const isObjectId = (s: string): boolean => /^[0-9a-f]{24}$/i.test(s);

const oneOf = <V extends string>(values: readonly V[], v: string): V | null =>
  (values as readonly string[]).includes(v) ? (v as V) : null;

const isCourseKey = (s: string): boolean => s === "not-sure" || isObjectId(s) || /^[a-z0-9-]{1,64}$/.test(s);

export function parseLeadParams<T extends LeadType>(type: T, raw: RawParams): LeadParamsFor<T> {
  const page = Number.parseInt(first(raw.page), 10);
  const lead = first(raw.lead);
  const common: Common = {
    status: oneOf(LEAD_STATUS_VALUES, first(raw.status)),
    q: first(raw.q).trim().slice(0, SEARCH_MAX),
    page: Number.isFinite(page) && page >= 1 ? page : 1,
    lead: isObjectId(lead) ? lead : null,
  };
  if (type === "workshop") {
    const month = first(raw.month);
    const params: WorkshopParams = {
      ...common,
      role: oneOf(ROLE_VALUES, first(raw.role)),
      month: /^\d{4}-\d{2}$/.test(month) ? month : null,
    };
    return params as LeadParamsFor<T>;
  }
  const course = first(raw.course);
  const category = first(raw.category);
  const params: CourseParams = {
    ...common,
    course: isCourseKey(course) ? course : null,
    category: isObjectId(category) ? category : null,
    level: oneOf(LEVEL_VALUES, first(raw.level)),
    age: oneOf(AGE_VALUES, first(raw.age)),
  };
  return params as LeadParamsFor<T>;
}

/** Escapes text so it is matched literally inside a regular expression (user text is never used as a pattern). */
export function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** The page to show once the total is known: never below 1, never past the last page. */
export function clampPage(page: number, total: number): number {
  const last = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return Math.min(Math.max(1, page), last);
}

/** The filter keys that go in each view's address, in a fixed order. */
export const LEAD_FILTER_KEYS: Record<LeadType, readonly string[]> = {
  workshop: ["status", "role", "month", "q"],
  course: ["status", "course", "category", "level", "age", "q"],
};

/**
 * The address of an admin list for the given params: only the listed keys, in a fixed order, with defaults left out so addresses
 * stay short. Shared by the submissions views and the blog posts list (specs/033-admin-blog research R12). Only ids, fixed values
 * and the owner's own search text go in.
 */
export function listHref(basePath: string, keys: readonly string[], params: Record<string, unknown>): string {
  const sp = new URLSearchParams();
  const values = params;
  for (const key of keys) {
    const v = values[key];
    if (typeof v === "string" && v) sp.set(key, v);
  }
  if (typeof values.page === "number" && values.page > 1) sp.set("page", String(values.page));
  if (typeof values.lead === "string" && values.lead) sp.set("lead", values.lead);
  const qs = sp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/** The submissions view's address for the given params (see listHref). */
export function leadsHref<T extends LeadType>(type: T, params: Partial<LeadParamsFor<T>>): string {
  return listHref(SUBMISSIONS_PATH[type], LEAD_FILTER_KEYS[type], params as Record<string, unknown>);
}
