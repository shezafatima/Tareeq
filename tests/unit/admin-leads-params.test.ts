import assert from "node:assert/strict";
import { test } from "node:test";
import { clampPage, escapeRegex, leadsHref, parseLeadParams } from "../../src/lib/admin/leads-params.ts";

const ID = "0123456789abcdef01234567";

test("accepts the known values", () => {
  const p = parseLeadParams({ type: "course", status: "booked", q: " Ayesha ", page: "3", lead: ID });
  assert.deepEqual(p, { type: "course", status: "booked", q: "Ayesha", page: 3, lead: ID });
});

test("ignores unknown or malformed values", () => {
  const p = parseLeadParams({ type: "bogus", status: "nope", page: "-4", lead: "not-an-id", q: undefined });
  assert.deepEqual(p, { type: null, status: null, q: "", page: 1, lead: null });
  assert.equal(parseLeadParams({ page: "abc" }).page, 1);
  assert.equal(parseLeadParams({ page: "0" }).page, 1);
});

test("takes the first value of a repeated parameter and trims the search to 100 characters", () => {
  assert.equal(parseLeadParams({ status: ["closed", "new"] }).status, "closed");
  assert.equal(parseLeadParams({ q: "x".repeat(500) }).q.length, 100);
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

test("builds short addresses and leaves defaults out", () => {
  assert.equal(leadsHref({}), "/admin");
  assert.equal(leadsHref({ page: 1 }), "/admin");
  assert.equal(leadsHref({ status: "new", page: 2, lead: ID }), `/admin?status=new&page=2&lead=${ID}`);
});
