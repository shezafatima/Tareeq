import assert from "node:assert/strict";
import { test } from "node:test";
import {
  chartDays,
  dashboardBounds,
  formatLongDate,
  greetingFor,
  isOverdue,
  karachiDayKey,
  karachiTime,
  relativeDays,
  subtractWorkingHours,
  workingMsBetween,
} from "../../src/lib/admin/dashboard-time.ts";

// specs/029-admin-dashboard research R1, R2. 2026-11-11 is a Wednesday; 7 Nov is a Saturday and 8 Nov a Sunday.
const HOUR = 3_600_000;
/** a Karachi wall-clock time as a Date (Karachi is UTC+05:00 all year) */
const karachi = (y: number, m: number, d: number, h = 0, min = 0) => new Date(Date.UTC(y, m - 1, d, h, min) - 5 * HOUR);
const iso = (d: Date) => d.toISOString();

test("karachiDayKey uses the Karachi date, not the UTC date", () => {
  assert.equal(karachiDayKey(new Date("2026-11-10T18:30:00Z")), "2026-11-10");
  assert.equal(karachiDayKey(new Date("2026-11-10T19:00:00Z")), "2026-11-11");
});

test("dashboardBounds on a Wednesday morning", () => {
  const b = dashboardBounds(new Date("2026-11-11T05:00:00Z"));
  assert.equal(iso(b.todayStart), "2026-11-10T19:00:00.000Z");
  assert.equal(iso(b.weekStart), "2026-11-08T19:00:00.000Z");
  assert.equal(iso(b.lastWeekStart), "2026-11-01T19:00:00.000Z");
  assert.equal(iso(b.monthStart), "2026-10-31T19:00:00.000Z");
  assert.equal(iso(b.chartStart), "2026-10-28T19:00:00.000Z");
  assert.equal(iso(b.start30), "2026-10-12T19:00:00.000Z");
});

test("the week starts on Monday, also just after midnight and on a Sunday night", () => {
  assert.equal(iso(dashboardBounds(karachi(2026, 11, 9, 0, 30)).weekStart), iso(karachi(2026, 11, 9)));
  assert.equal(iso(dashboardBounds(karachi(2026, 11, 15, 23, 0)).weekStart), iso(karachi(2026, 11, 9)));
});

test("a lead from Saturday evening is not overdue on Monday morning, and is after 48 working hours", () => {
  const created = karachi(2026, 11, 7, 18, 0);
  assert.equal(isOverdue(created, karachi(2026, 11, 9, 9, 0)), false);
  assert.equal(isOverdue(created, karachi(2026, 11, 10, 18, 0)), false); // exactly 48 working hours
  assert.equal(isOverdue(created, karachi(2026, 11, 10, 18, 1)), true);
});

test("a lead from Sunday starts its clock on Monday 00:00", () => {
  const created = karachi(2026, 11, 8, 10, 0);
  assert.equal(isOverdue(created, karachi(2026, 11, 10, 23, 59)), false);
  assert.equal(isOverdue(created, karachi(2026, 11, 11, 0, 0)), false); // exactly 48 working hours
  assert.equal(isOverdue(created, karachi(2026, 11, 11, 0, 1)), true);
});

test("a midweek lead is overdue two days later", () => {
  const created = karachi(2026, 11, 4, 10, 0); // Wednesday
  assert.equal(isOverdue(created, karachi(2026, 11, 6, 10, 0)), false);
  assert.equal(isOverdue(created, karachi(2026, 11, 6, 10, 1)), true);
});

test("a lead from Friday evening is overdue on Tuesday evening, Sunday not counted", () => {
  const created = karachi(2026, 11, 6, 18, 0);
  assert.equal(isOverdue(created, karachi(2026, 11, 9, 18, 0)), false); // Fri 6h + Sat 24h + Mon 18h = 48h
  assert.equal(isOverdue(created, karachi(2026, 11, 9, 18, 1)), true);
});

test("workingMsBetween is zero inside a Sunday and for a backwards range", () => {
  assert.equal(workingMsBetween(karachi(2026, 11, 8, 3), karachi(2026, 11, 8, 20)), 0);
  assert.equal(workingMsBetween(karachi(2026, 11, 10), karachi(2026, 11, 9)), 0);
  assert.equal(workingMsBetween(karachi(2026, 11, 7, 12), karachi(2026, 11, 9, 12)), 24 * HOUR); // Sat 12h + Mon 12h
});

test("the cutoff walks back past Sundays to the start of the Sunday run", () => {
  // 48 working hours before Wednesday 00:00 ends on Monday 00:00, which is the end of Sunday's plateau
  assert.equal(iso(subtractWorkingHours(karachi(2026, 11, 11), 48)), iso(karachi(2026, 11, 8)));
  assert.equal(iso(subtractWorkingHours(karachi(2026, 11, 11, 0, 1), 48)), iso(karachi(2026, 11, 9, 0, 1)));
  // from inside a Sunday, the walk starts at that Sunday's 00:00
  assert.equal(iso(subtractWorkingHours(karachi(2026, 11, 8, 12), 6)), iso(karachi(2026, 11, 7, 18)));
});

test("isOverdue always agrees with the cutoff (every 3 hours over three weeks, on and just after the hour)", () => {
  const base = karachi(2026, 10, 26).getTime(); // a Monday 00:00
  const stamps: Date[] = [];
  for (let k = 0; k < 168; k++) {
    stamps.push(new Date(base + k * 3 * HOUR), new Date(base + k * 3 * HOUR + 60_000));
  }
  for (const now of stamps) {
    const cutoff = subtractWorkingHours(now, 48).getTime();
    for (const created of stamps) {
      if (created > now) continue;
      assert.equal(
        isOverdue(created, now),
        created.getTime() < cutoff,
        `created ${created.toISOString()} now ${now.toISOString()}`,
      );
    }
  }
});

test("chartDays gives 14 Karachi days ending today", () => {
  const days = chartDays(new Date("2026-11-11T05:00:00Z"));
  assert.equal(days.length, 14);
  assert.equal(days[0].day, "2026-10-29");
  assert.equal(days[13].day, "2026-11-11");
  assert.equal(days[13].label, "Wed 11 Nov");
  assert.equal(days[12].label, "Tue 10 Nov");
});

test("chartDays near midnight uses the Karachi date", () => {
  const days = chartDays(new Date("2026-11-10T19:30:00Z")); // 00:30 on the 11th in Karachi
  assert.equal(days[13].day, "2026-11-11");
});

test("greetingFor follows Karachi time", () => {
  assert.equal(greetingFor(karachi(2026, 11, 11, 4, 59)), "Good evening");
  assert.equal(greetingFor(karachi(2026, 11, 11, 5, 0)), "Good morning");
  assert.equal(greetingFor(karachi(2026, 11, 11, 11, 59)), "Good morning");
  assert.equal(greetingFor(karachi(2026, 11, 11, 12, 0)), "Good afternoon");
  assert.equal(greetingFor(karachi(2026, 11, 11, 16, 59)), "Good afternoon");
  assert.equal(greetingFor(karachi(2026, 11, 11, 17, 0)), "Good evening");
  assert.equal(greetingFor(karachi(2026, 11, 11, 1, 0)), "Good evening");
});

test("formatLongDate", () => {
  assert.equal(formatLongDate(new Date("2026-11-11T05:00:00Z")), "Wednesday, 11 November 2026");
  assert.equal(formatLongDate(new Date("2026-11-10T19:30:00Z")), "Wednesday, 11 November 2026"); // already the 11th in Karachi
});

test("relativeDays counts Karachi calendar days", () => {
  const now = new Date("2026-11-10T19:01:00Z"); // 00:01 on the 11th in Karachi
  assert.equal(relativeDays(new Date("2026-11-10T19:00:30Z"), now), "today");
  assert.equal(relativeDays(new Date("2026-11-10T18:59:00Z"), now), "1 day ago"); // 23:59 on the 10th
  assert.equal(relativeDays(karachi(2026, 11, 8, 10), karachi(2026, 11, 11, 10)), "3 days ago");
});

test("karachiTime", () => {
  assert.equal(karachiTime(new Date("2026-11-11T09:05:00Z")), "14:05");
  assert.equal(karachiTime(new Date("2026-11-10T19:00:00Z")), "00:00");
});
