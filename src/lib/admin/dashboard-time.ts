// Karachi-time arithmetic for the admin dashboard (specs/029-admin-dashboard research R1, R2, R9, R10).
// Pure: no server imports, so unit tests can load it. Pakistan has had no daylight saving since 2009, so a fixed
// UTC+05:00 offset is exact. The MongoDB aggregation uses the same offset (KARACHI_TZ_OFFSET), so both sides agree.
// Names and dates are built from fixed tables, not Intl, so the output never depends on the server's ICU data.

export const KARACHI_OFFSET_MS = 5 * 60 * 60 * 1000;
export const KARACHI_TZ_OFFSET = "+05:00";
/** 2 working days (spec FR-006); Sunday is not a working day. */
export const REPLY_WINDOW_WORKING_HOURS = 48;
/** The owner's display name in the greeting (one admin account; spec Assumptions). */
export const OWNER_NAME = "Sheza";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const WEEKDAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;
const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

export type DashboardBounds = {
  now: Date;
  /** Karachi 00:00 today */
  todayStart: Date;
  /** todayStart minus 13 days: the first of the 14 chart days */
  chartStart: Date;
  /** Karachi Monday 00:00 of this week */
  weekStart: Date;
  /** weekStart minus 7 days */
  lastWeekStart: Date;
  /** Karachi 1st of this month, 00:00 */
  monthStart: Date;
  /** todayStart minus 29 days: the first of the 30 days for top courses */
  start30: Date;
  /** a "new" lead created before this is overdue */
  overdueCutoff: Date;
};

/** A date whose UTC fields read as Karachi wall-clock time. */
const shifted = (d: Date): Date => new Date(d.getTime() + KARACHI_OFFSET_MS);

/** Karachi 00:00 of the day `d` falls in. */
function karachiMidnight(d: Date): Date {
  const t = d.getTime() + KARACHI_OFFSET_MS;
  return new Date(Math.floor(t / DAY) * DAY - KARACHI_OFFSET_MS);
}

const isSunday = (karachiMidnightOfDay: Date): boolean => shifted(karachiMidnightOfDay).getUTCDay() === 0;

/** Whole Karachi calendar days since 1970-01-01: it goes up by one at each Karachi midnight. */
export function karachiDayNumber(d: Date): number {
  return Math.floor((d.getTime() + KARACHI_OFFSET_MS) / DAY);
}

/** The Karachi calendar date of `d`, as YYYY-MM-DD. */
export function karachiDayKey(d: Date): string {
  return shifted(d).toISOString().slice(0, 10);
}

/**
 * Working time between two instants: the elapsed time minus every Karachi Sunday (00:00 to 24:00) inside the range.
 * Public holidays are not considered. 0 when `to` is not after `from`.
 */
export function workingMsBetween(from: Date, to: Date): number {
  const a = from.getTime();
  const b = to.getTime();
  if (b <= a) return 0;
  let total = b - a;
  for (let day = karachiMidnight(from).getTime(); day < b; day += DAY) {
    if (isSunday(new Date(day))) total -= Math.max(0, Math.min(b, day + DAY) - Math.max(a, day));
  }
  return total;
}

/**
 * The instant that is `hours` of working time before `now`. It is the inverse of workingMsBetween, so
 * `workingMsBetween(c, now) > hours` holds exactly when `c < subtractWorkingHours(now, hours)`.
 * If the walk ends on a midnight that follows Sundays, it moves back to the start of those Sundays: a lead that
 * arrived on a Sunday has used no working time yet, and must not turn overdue early.
 */
export function subtractWorkingHours(now: Date, hours: number): Date {
  let remaining = hours * HOUR;
  let cursor = now.getTime();
  for (;;) {
    let dayStart = karachiMidnight(new Date(cursor)).getTime();
    if (dayStart === cursor) dayStart -= DAY; // exactly at midnight: the span to walk is the day before
    if (isSunday(new Date(dayStart))) {
      cursor = dayStart;
      continue;
    }
    const available = cursor - dayStart;
    if (available >= remaining) {
      let result = cursor - remaining;
      while (result === karachiMidnight(new Date(result)).getTime() && isSunday(new Date(result - DAY))) result -= DAY;
      return new Date(result);
    }
    remaining -= available;
    cursor = dayStart;
  }
}

/** True when a lead created at `createdAt` has waited more than the reply window, counting working time only. */
export function isOverdue(createdAt: Date, now: Date): boolean {
  return workingMsBetween(createdAt, now) > REPLY_WINDOW_WORKING_HOURS * HOUR;
}

export function dashboardBounds(now: Date): DashboardBounds {
  const todayStart = karachiMidnight(now);
  const sinceMonday = (shifted(now).getUTCDay() + 6) % 7;
  const weekStart = new Date(todayStart.getTime() - sinceMonday * DAY);
  const s = shifted(now);
  return {
    now,
    todayStart,
    chartStart: new Date(todayStart.getTime() - 13 * DAY),
    weekStart,
    lastWeekStart: new Date(weekStart.getTime() - 7 * DAY),
    monthStart: new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), 1) - KARACHI_OFFSET_MS),
    start30: new Date(todayStart.getTime() - 29 * DAY),
    overdueCutoff: subtractWorkingHours(now, REPLY_WINDOW_WORKING_HOURS),
  };
}

/** The 14 chart days, oldest first, ending today: the Karachi date and a label like "Tue 10 Nov". */
export function chartDays(now: Date): { day: string; label: string }[] {
  const today = karachiMidnight(now).getTime();
  return Array.from({ length: 14 }, (_, i) => {
    const start = new Date(today - (13 - i) * DAY);
    const s = shifted(start);
    return {
      day: karachiDayKey(start),
      label: `${WEEKDAYS_SHORT[s.getUTCDay()]} ${s.getUTCDate()} ${MONTHS_SHORT[s.getUTCMonth()]}`,
    };
  });
}

/** Morning 05:00-11:59, afternoon 12:00-16:59, otherwise evening (Karachi time). */
export function greetingFor(now: Date): "Good morning" | "Good afternoon" | "Good evening" {
  const hour = shifted(now).getUTCHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  return "Good evening";
}

/** "Wednesday, 11 November 2026" in Karachi time. */
export function formatLongDate(now: Date): string {
  const s = shifted(now);
  return `${WEEKDAYS_LONG[s.getUTCDay()]}, ${s.getUTCDate()} ${MONTHS_LONG[s.getUTCMonth()]} ${s.getUTCFullYear()}`;
}

/** Whole Karachi calendar days between the two instants: "today", "1 day ago", "N days ago". */
export function relativeDays(then: Date, now: Date): string {
  const days = Math.round((karachiMidnight(now).getTime() - karachiMidnight(then).getTime()) / DAY);
  if (days <= 0) return "today";
  return days === 1 ? "1 day ago" : `${days} days ago`;
}

/** "14:05" in Karachi time. */
export function karachiTime(d: Date): string {
  const s = shifted(d);
  return `${String(s.getUTCHours()).padStart(2, "0")}:${String(s.getUTCMinutes()).padStart(2, "0")}`;
}
