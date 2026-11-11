import assert from "node:assert/strict";
import { test } from "node:test";
import { clampPage, escapeRegex, leadsHref, parseLeadParams } from "../../src/lib/admin/leads-params.ts";

// specs/026-split-submissions/contracts/routes-and-ui.md "Query parameters"

const ID = "0123456789abcdef01234567";
const CAT = "fedcba9876543210fedcba98";

test("workshop view accepts its known values", () => {
  const p = parseLeadParams("workshop", { status: "booked", role: "teacher", month: "2026-12", q: " Ayesha ", page: "3", lead: ID });
  assert.deepEqual(p, { status: "booked", q: "Ayesha", page: 3, lead: ID, role: "teacher", month: "2026-12" });
});

test("course view accepts its known values", () => {
  const p = parseLeadParams("course", {
    status: "new", course: ID, category: CAT, level: "some-experience", age: "under-18", q: "ali", page: "2", lead: ID,
  });
  assert.deepEqual(p, {
    status: "new", q: "ali", page: 2, lead: ID, course: ID, category: CAT, level: "some-experience", age: "under-18",
  });
  assert.equal(parseLeadParams("course", { course: "not-sure" }).course, "not-sure");
  assert.equal(parseLeadParams("course", { course: "ai-basics" }).course, "ai-basics"); // legacy pre-025 id
});

test("each view ignores the other view's params and the old type param", () => {
  const w = parseLeadParams("workshop", { course: ID, category: CAT, level: "beginner", age: "18-plus", type: "course" });
  assert.deepEqual(w, { status: null, q: "", page: 1, lead: null, role: null, month: null });
  const c = parseLeadParams("course", { role: "school", month: "2026-12", type: "workshop" });
  assert.deepEqual(c, { status: null, q: "", page: 1, lead: null, course: null, category: null, level: null, age: null });
});

test("ignores unknown or malformed values", () => {
  const w = parseLeadParams("workshop", { status: "nope", role: "admin", month: "Dec 2026", page: "-4", lead: "not-an-id" });
  assert.deepEqual(w, { status: null, q: "", page: 1, lead: null, role: null, month: null });
  const c = parseLeadParams("course", { course: "Bad Value!", category: "not-hex", level: "expert", age: "12" });
  assert.equal(c.course, null);
  assert.equal(c.category, null);
  assert.equal(c.level, null);
  assert.equal(c.age, null);
  assert.equal(parseLeadParams("workshop", { page: "abc" }).page, 1);
  assert.equal(parseLeadParams("workshop", { page: "0" }).page, 1);
});

test("takes the first value of a repeated parameter and trims the search to 100 characters", () => {
  assert.equal(parseLeadParams("workshop", { status: ["closed", "new"] }).status, "closed");
  assert.equal(parseLeadParams("course", { q: "x".repeat(500) }).q.length, 100);
});

test("search text is matched literally", () => {
  const text = "a.b*c(d)[e]|f\\g";
  assert.ok(new RegExp(escapeRegex(text)).test(text));
  assert.ok(!new RegExp(escapeRegex("a.b")).test("axb"));
});

test("page is clamped to 1..last", () => {
  assert.equal(clampPage(999, 51), 3);
  assert.equal(clampPage(0, 51), 1);
  assert.equal(clampPage(5, 0), 1);
  assert.equal(clampPage(2, 25), 1);
  assert.equal(clampPage(2, 26), 2);
});

test("builds each view's address, leaves defaults out and keeps a fixed key order", () => {
  assert.equal(leadsHref("workshop", {}), "/admin/submissions/workshops");
  assert.equal(leadsHref("course", { page: 1, q: "" }), "/admin/submissions/courses");
  assert.equal(
    leadsHref("workshop", { lead: ID, page: 2, q: "x", month: "2026-12", role: "school", status: "new" }),
    `/admin/submissions/workshops?status=new&role=school&month=2026-12&q=x&page=2&lead=${ID}`,
  );
  assert.equal(
    leadsHref("course", { age: "under-18", level: "beginner", category: CAT, course: "not-sure", status: "booked" }),
    `/admin/submissions/courses?status=booked&course=not-sure&category=${CAT}&level=beginner&age=under-18`,
  );
});

test("the other view's keys never leak into an address", () => {
  const crafted = { role: "school", course: ID } as unknown as Parameters<typeof leadsHref<"course">>[1];
  assert.equal(leadsHref("course", crafted), `/admin/submissions/courses?course=${ID}`);
});
