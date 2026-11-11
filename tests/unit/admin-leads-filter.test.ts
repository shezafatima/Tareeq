import assert from "node:assert/strict";
import { test } from "node:test";
import { courseFilter, workshopFilter } from "../../src/lib/admin/leads-filter.ts";
import { parseLeadParams, type CourseParams, type WorkshopParams } from "../../src/lib/admin/leads-params.ts";

// SC-001: every filter is scoped to its view's type, whatever the params (specs/026-split-submissions research R10).

const ID = "0123456789abcdef01234567";
const CAT = "fedcba9876543210fedcba98";
const w = (raw: Record<string, string>) => parseLeadParams("workshop", raw);
const c = (raw: Record<string, string>) => parseLeadParams("course", raw);

test("workshop filters are always type workshop", () => {
  assert.equal(workshopFilter(w({})).type, "workshop");
  assert.equal(workshopFilter(w({ status: "new", role: "school", month: "2026-12", q: "x" })).type, "workshop");
  // a crafted params object carrying a foreign field cannot change the type
  const crafted = { ...w({}), type: "course" } as unknown as WorkshopParams;
  assert.equal(workshopFilter(crafted).type, "workshop");
});

test("course filters are always type course", () => {
  assert.equal(courseFilter(c({}), null).type, "course");
  const crafted = { ...c({ category: CAT }), type: "workshop" } as unknown as CourseParams;
  assert.equal(courseFilter(crafted, [ID]).type, "course");
});

test("filter params map to the stored fields", () => {
  assert.deepEqual(workshopFilter(w({ status: "contacted", role: "teacher", month: "2027-01" })), {
    status: "contacted", role: "teacher", preferredMonth: "2027-01", type: "workshop",
  });
  assert.deepEqual(courseFilter(c({ status: "booked", course: "not-sure", level: "beginner", age: "18-plus" }), null), {
    status: "booked", courseId: "not-sure", level: "beginner", ageGroup: "18-plus", type: "course",
  });
});

test("workshop search covers organization; course search does not", () => {
  const ws = workshopFilter(w({ q: "Beacon" })).$or as Record<string, RegExp>[];
  assert.deepEqual(ws.map((o) => Object.keys(o)[0]), ["fullName", "email", "organization", "phone"]);
  const cs = courseFilter(c({ q: "Beacon" }), null).$or as Record<string, RegExp>[];
  assert.deepEqual(cs.map((o) => Object.keys(o)[0]), ["fullName", "email", "phone"]);
});

test("a phone typed as 0300... also matches on its digits, and search text is literal", () => {
  const or = workshopFilter(w({ q: "0300 1234567" })).$or as Record<string, RegExp>[];
  const last = or[or.length - 1];
  assert.ok(last.phone.test("+923001234567"));
  const dotted = courseFilter(c({ q: "a.b" }), null).$or as Record<string, RegExp>[];
  assert.ok(!dotted[0].fullName.test("axb"));
});

test("category matches the snapshot, or older records whose current course is in it", () => {
  const f = courseFilter(c({ category: CAT, q: "ali" }), [ID]);
  assert.deepEqual(f.$and, [{ $or: [{ categoryId: CAT }, { categoryId: { $exists: false }, courseId: { $in: [ID] } }] }]);
  assert.ok(Array.isArray(f.$or), "search $or is kept alongside the category $and");
  const none = courseFilter(c({ category: CAT }), null);
  assert.deepEqual((none.$and as { $or: Record<string, unknown>[] }[])[0].$or[1], {
    categoryId: { $exists: false }, courseId: { $in: [] },
  });
});
