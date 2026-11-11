import assert from "node:assert/strict";
import { test } from "node:test";
import {
  niceMax,
  toAttentionRow,
  toRecentRow,
  toSummary,
  weekDeltaText,
  type FacetResult,
  type RawLead,
} from "../../src/lib/admin/dashboard-shape.ts";

// specs/029-admin-dashboard data-model.md. 2026-11-11T05:00Z is Wednesday 10:00 in Karachi.
const NOW = new Date("2026-11-11T05:00:00Z");
const ID = "64b7f0f0f0f0f0f0f0f0f0f0";

const emptyFacet: FacetResult = { newByType: [], week: [], booked: [], daily: [], topCourses: [] };

test("weekDeltaText never shows a percentage", () => {
  assert.equal(weekDeltaText(6, 4), "+2 vs last week");
  assert.equal(weekDeltaText(3, 0), "+3 vs last week");
  assert.equal(weekDeltaText(2, 3), "−1 vs last week");
  assert.equal(weekDeltaText(4, 4), "No change vs last week");
  assert.equal(weekDeltaText(0, 0), "No change vs last week");
});

test("niceMax rounds up to 1, 2 or 5 times a power of ten", () => {
  const cases: [number, number][] = [[0, 1], [1, 1], [2, 2], [3, 5], [5, 5], [6, 10], [7, 10], [12, 20], [45, 50], [100, 100], [101, 200]];
  for (const [n, expected] of cases) assert.equal(niceMax(n), expected, `niceMax(${n})`);
});

test("toSummary on an empty facet gives zeros, 14 days and no top courses", () => {
  const s = toSummary(emptyFacet, NOW);
  assert.deepEqual(s.newCounts, { workshop: 0, course: 0 });
  assert.equal(s.week.deltaText, "No change vs last week");
  assert.equal(s.bookedThisMonth, 0);
  assert.equal(s.daily.length, 14);
  assert.ok(s.daily.every((d) => d.workshop === 0 && d.course === 0));
  assert.deepEqual(s.topCourses, []);
});

test("toSummary maps counts onto the right Karachi days", () => {
  const s = toSummary(
    {
      newByType: [{ _id: "workshop", n: 4 }, { _id: "course", n: 2 }],
      week: [{ _id: "this", n: 6 }, { _id: "last", n: 4 }],
      booked: [{ n: 3 }],
      daily: [
        { _id: { day: "2026-11-10", type: "workshop" }, n: 2 },
        { _id: { day: "2026-11-10", type: "course" }, n: 1 },
        { _id: { day: "2026-11-11", type: "course" }, n: 5 },
        { _id: { day: "2020-01-01", type: "course" }, n: 9 }, // outside the 14 days: ignored
      ],
      topCourses: [{ _id: "c1", name: "Alpha", n: 7 }, { _id: "c2", name: "Beta", n: 7 }],
    },
    NOW,
  );
  assert.deepEqual(s.newCounts, { workshop: 4, course: 2 });
  assert.deepEqual(s.week, { thisWeek: 6, lastWeek: 4, delta: 2, deltaText: "+2 vs last week" });
  assert.equal(s.bookedThisMonth, 3);
  const tenth = s.daily.find((d) => d.day === "2026-11-10");
  assert.deepEqual(tenth, { day: "2026-11-10", label: "Tue 10 Nov", workshop: 2, course: 1 });
  assert.equal(s.daily[13].course, 5);
  assert.equal(s.daily.reduce((n, d) => n + d.workshop + d.course, 0), 8);
  assert.deepEqual(s.topCourses, [
    { courseId: "c1", name: "Alpha", count: 7 },
    { courseId: "c2", name: "Beta", count: 7 },
  ]);
});

test("a course row shows the stored course name and links to its drawer", () => {
  const row = toRecentRow(
    { _id: ID, type: "course", fullName: "Test Lead", createdAt: new Date("2026-11-11T03:00:00Z"), status: "booked", courseName: "Spoken English" },
    NOW,
  );
  assert.equal(row.context, "Spoken English");
  assert.equal(row.status, "booked");
  assert.equal(row.href, `/admin/submissions/courses?lead=${ID}`);
  assert.equal(row.when, "today, 08:00");
});

test("a workshop row shows the organization, or a dash when it is empty", () => {
  const base = { _id: ID, type: "workshop" as const, fullName: "Test Lead", createdAt: new Date("2026-11-08T05:00:00Z") };
  assert.equal(toRecentRow({ ...base, organization: "City School" }, NOW).context, "City School");
  const blank = toRecentRow({ ...base, organization: "" }, NOW);
  assert.equal(blank.context, "—");
  assert.equal(blank.when, "3 days ago");
  assert.equal(blank.href, `/admin/submissions/workshops?lead=${ID}`);
  assert.equal(blank.status, "new");
});

test("attention rows carry the name, the age and the drawer link", () => {
  const row = toAttentionRow({ _id: ID, type: "course", fullName: "Test Lead", createdAt: new Date("2026-11-08T05:00:00Z") }, NOW);
  assert.deepEqual(row, { id: ID, type: "course", name: "Test Lead", age: "3 days ago", href: `/admin/submissions/courses?lead=${ID}` });
});

test("rows never carry personal data beyond the name, even when the stored lead has it", () => {
  const withExtras = {
    _id: ID,
    type: "workshop",
    fullName: "Test Lead",
    createdAt: new Date("2026-11-08T05:00:00Z"),
    organization: "City School",
    phone: "+923001234567",
    email: "someone@example.com",
    message: "private",
    adminNotes: "private",
  } as RawLead;
  for (const row of [toRecentRow(withExtras, NOW), toAttentionRow(withExtras, NOW)]) {
    const text = JSON.stringify(row);
    for (const key of ["phone", "email", "message", "adminNotes"]) assert.ok(!(key in row), key);
    assert.ok(!text.includes("923001234567") && !text.includes("someone@example.com") && !text.includes("private"));
  }
});
