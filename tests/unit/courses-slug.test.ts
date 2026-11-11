import assert from "node:assert/strict";
import { test } from "node:test";
import { nextFreeSlug } from "../../src/lib/admin/slug.ts";

test("a free slug is returned unchanged", () => {
  assert.equal(nextFreeSlug("intro-to-ai", []), "intro-to-ai");
  assert.equal(nextFreeSlug("intro-to-ai", ["other"]), "intro-to-ai");
});

test("the first collision gets -2", () => {
  assert.equal(nextFreeSlug("intro-to-ai", ["intro-to-ai"]), "intro-to-ai-2");
});

test("the lowest free number is used, filling gaps", () => {
  assert.equal(nextFreeSlug("ai", ["ai", "ai-2", "ai-4"]), "ai-3");
  assert.equal(nextFreeSlug("ai", ["ai", "ai-2", "ai-3"]), "ai-4");
});

test("the base is trimmed so the result fits the maximum length", () => {
  const base = "a".repeat(80);
  const result = nextFreeSlug(base, [base], 80);
  assert.equal(result.length, 80);
  assert.ok(result.endsWith("-2"));
});

test("trimming never leaves a double hyphen", () => {
  const base = `${"a".repeat(77)}-bc`; // trimmed to 78 chars ends on the hyphen
  const result = nextFreeSlug(base, [base], 80);
  assert.ok(!result.includes("--"), result);
  assert.ok(result.length <= 80);
  assert.match(result, /^[a-z0-9]+(-[a-z0-9]+)*$/);
});
