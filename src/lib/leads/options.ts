// Fixed choices for the lead forms, and the preferred-month list. Pure: shared by client and server.

export type Option<V extends string = string> = { value: V; label: string };

export const ROLE_OPTIONS = [
  { value: "school", label: "School" },
  { value: "teacher", label: "Teacher" },
] as const satisfies readonly Option[];

export const LEVEL_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "some-experience", label: "Some experience" },
] as const satisfies readonly Option[];

export const AGE_OPTIONS = [
  { value: "under-18", label: "Under 18" },
  { value: "18-plus", label: "18 or over" },
] as const satisfies readonly Option[];

export const ROLE_VALUES = ROLE_OPTIONS.map((o) => o.value) as ["school", "teacher"];
export const LEVEL_VALUES = LEVEL_OPTIONS.map((o) => o.value) as ["beginner", "some-experience"];
export const AGE_VALUES = AGE_OPTIONS.map((o) => o.value) as ["under-18", "18-plus"];

export function labelFor(options: readonly Option[], value: string | null | undefined): string {
  return options.find((o) => o.value === value)?.label ?? "Not given";
}

const ZONE = "Asia/Karachi";

/** Year and month (1-12) of `now` in Pakistan time. */
function karachiYearMonth(now: Date): { y: number; m: number } {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: ZONE, year: "numeric", month: "numeric" }).formatToParts(now);
  return { y: Number(parts.find((p) => p.type === "year")!.value), m: Number(parts.find((p) => p.type === "month")!.value) };
}

function shift(y: number, m: number, by: number): { y: number; m: number } {
  const i = y * 12 + (m - 1) + by;
  return { y: Math.floor(i / 12), m: (i % 12) + 1 };
}

const key = ({ y, m }: { y: number; m: number }) => `${y}-${String(m).padStart(2, "0")}`;

/** "2026-12" -> "December 2026" (null/empty -> "Not given"). */
export function monthLabel(value: string | null | undefined): string {
  if (!value) return "Not given";
  const [y, m] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 1)));
}

/** "2026-12" -> "Dec 2026": short enough for a half-width dropdown on a 360px phone. */
function monthShortLabel(value: string): string {
  const [y, m] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 1)));
}

/** The current month in Pakistan plus the next 11 (short labels for the dropdown; emails use monthLabel). */
export function monthOptions(now: Date): Option[] {
  const start = karachiYearMonth(now);
  return Array.from({ length: 12 }, (_, i) => {
    const value = key(shift(start.y, start.m, i));
    return { value, label: monthShortLabel(value) };
  });
}

/** Months the server accepts: the offered list plus the previous month (a page left open over a month change). */
export function allowedMonths(now: Date): Set<string> {
  const start = karachiYearMonth(now);
  return new Set([key(shift(start.y, start.m, -1)), ...monthOptions(now).map((o) => o.value)]);
}
