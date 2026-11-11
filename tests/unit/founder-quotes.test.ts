import assert from "node:assert/strict";
import { test } from "node:test";
import { karachiDayNumber } from "../../src/lib/admin/dashboard-time.ts";
import { FOUNDER_QUOTES, QUOTE_STEP, quoteIndexForDay, quoteOfTheDay } from "../../src/lib/admin/founder-quotes.ts";

// specs/029-admin-dashboard FR-025. Karachi midnight is 19:00 UTC the evening before.
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

test("the list is a healthy size, with no blanks or repeats", () => {
  assert.ok(FOUNDER_QUOTES.length >= 30);
  assert.equal(new Set(FOUNDER_QUOTES).size, FOUNDER_QUOTES.length);
  for (const q of FOUNDER_QUOTES) {
    assert.ok(q.trim().length > 0 && q.length <= 150, q);
    assert.equal(q, q.trim());
  }
});

test("the step shares no factor with the list length, so every quote is used before any repeats", () => {
  assert.equal(gcd(QUOTE_STEP, FOUNDER_QUOTES.length), 1);
  const seen = new Set(Array.from({ length: FOUNDER_QUOTES.length }, (_, d) => quoteIndexForDay(1000 + d)));
  assert.equal(seen.size, FOUNDER_QUOTES.length);
});

test("neighbouring days never show the same quote", () => {
  for (let d = 0; d < 400; d++) assert.notEqual(quoteIndexForDay(d), quoteIndexForDay(d + 1));
});

test("it is the same quote all day and changes at Karachi midnight", () => {
  const morning = quoteOfTheDay(new Date("2026-11-11T00:30:00Z")); // 05:30 on the 11th in Karachi
  const lastMinute = quoteOfTheDay(new Date("2026-11-11T18:59:59Z")); // 23:59:59 on the 11th
  const midnight = quoteOfTheDay(new Date("2026-11-11T19:00:00Z")); // 00:00 on the 12th
  assert.equal(morning, lastMinute);
  assert.notEqual(lastMinute, midnight);
  assert.equal(karachiDayNumber(new Date("2026-11-11T19:00:00Z")) - karachiDayNumber(new Date("2026-11-11T18:59:59Z")), 1);
});

test("a negative or huge day number still gives a valid index", () => {
  for (const d of [-5, 0, 20_000, 1e9]) {
    const i = quoteIndexForDay(d);
    assert.ok(Number.isInteger(i) && i >= 0 && i < FOUNDER_QUOTES.length);
  }
});
