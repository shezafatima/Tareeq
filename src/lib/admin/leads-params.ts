// URL parameters for the Submissions page (specs/022-admin-panel/contracts/auth-and-routes.md). Pure: no server imports,
// so the unit tests can load it. Unknown values are ignored, never an error.

export const LEAD_TYPES = ["workshop", "course"] as const;
export const LEAD_STATUS_VALUES = ["new", "contacted", "booked", "closed"] as const;
export const PAGE_SIZE = 25;
export const SEARCH_MAX = 100;

export type LeadType = (typeof LEAD_TYPES)[number];
export type LeadStatusValue = (typeof LEAD_STATUS_VALUES)[number];

export type LeadParams = {
  type: LeadType | null;
  status: LeadStatusValue | null;
  q: string;
  page: number;
  /** opaque ObjectId of the lead whose drawer is open */
  lead: string | null;
};

type RawParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined): string => (Array.isArray(v) ? (v[0] ?? "") : (v ?? ""));

export const isObjectId = (s: string): boolean => /^[0-9a-f]{24}$/i.test(s);

export function parseLeadParams(raw: RawParams): LeadParams {
  const type = first(raw.type);
  const status = first(raw.status);
  const page = Number.parseInt(first(raw.page), 10);
  const lead = first(raw.lead);
  return {
    type: (LEAD_TYPES as readonly string[]).includes(type) ? (type as LeadType) : null,
    status: (LEAD_STATUS_VALUES as readonly string[]).includes(status) ? (status as LeadStatusValue) : null,
    q: first(raw.q).trim().slice(0, SEARCH_MAX),
    page: Number.isFinite(page) && page >= 1 ? page : 1,
    lead: isObjectId(lead) ? lead : null,
  };
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

/** `/admin?...` for the given params; defaults are left out so addresses stay short. Only ids and the owner's own search text go in. */
export function leadsHref(params: Partial<LeadParams>): string {
  const sp = new URLSearchParams();
  if (params.type) sp.set("type", params.type);
  if (params.status) sp.set("status", params.status);
  if (params.q) sp.set("q", params.q);
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  if (params.lead) sp.set("lead", params.lead);
  const qs = sp.toString();
  return qs ? `/admin?${qs}` : "/admin";
}
