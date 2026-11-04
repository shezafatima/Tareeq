import assert from "node:assert/strict";
import { test } from "node:test";
import { allowedMonths, monthLabel, monthOptions } from "../../src/lib/leads/options.ts";
import { generateRef, REF_PATTERN } from "../../src/lib/leads/reference.ts";

test("monthOptions lists the current Karachi month plus the next 11", () => {
  const months = monthOptions(new Date("2026-11-03T10:00:00Z"));
  assert.equal(months.length, 12);
  assert.deepEqual(months[0], { value: "2026-11", label: "Nov 2026" });
  assert.equal(months[11].value, "2027-10");
});

test("monthOptions uses Pakistan time at a month boundary", () => {
  // 20:00 UTC on 30 Nov is 01:00 on 1 Dec in Karachi (UTC+5)
  assert.equal(monthOptions(new Date("2026-11-30T20:00:00Z"))[0].value, "2026-12");
});

test("allowedMonths also accepts the previous month", () => {
  const allowed = allowedMonths(new Date("2026-11-03T10:00:00Z"));
  assert.ok(allowed.has("2026-10"));
  assert.ok(allowed.has("2027-10"));
  assert.ok(!allowed.has("2027-11"));
  assert.equal(allowed.size, 13);
});

test("monthLabel formats and handles empty", () => {
  assert.equal(monthLabel("2026-12"), "December 2026");
  assert.equal(monthLabel(null), "Not given");
});

test("generateRef always matches REF_PATTERN", () => {
  for (let i = 0; i < 1000; i++) assert.match(generateRef(), REF_PATTERN);
});
