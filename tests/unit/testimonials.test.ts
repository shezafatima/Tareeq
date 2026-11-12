import assert from "node:assert/strict";
import { test } from "node:test";
import { selectTestimonials } from "../../src/lib/testimonials/select.ts";
import type { Testimonial } from "../../src/content/types.ts";

const make = (over: Partial<Testimonial> = {}): Testimonial => ({
  youtubeUrl: "https://www.youtube.com/shorts/abcDEF12345",
  name: "A",
  role: "Teacher",
  quote: "q",
  consent: true,
  published: true,
  order: 1,
  ...over,
});
const placeholders = [make({ name: "P1", youtubeUrl: "https://www.youtube.com/shorts/PLACEHOLD01", order: 2 }), make({ name: "P2", youtubeUrl: "https://www.youtube.com/shorts/PLACEHOLD02", order: 1 })];
const prod = { dev: false, placeholders: [] as Testimonial[] };

test("only consent true AND published true are kept", () => {
  const items = [
    make({ name: "both" }),
    make({ name: "no-consent", consent: false }),
    make({ name: "unpublished", published: false }),
    make({ name: "neither", consent: false, published: false }),
  ];
  assert.deepEqual(selectTestimonials(items, prod).map((i) => i.name), ["both"]);
});

test("truthy but non-boolean flags are rejected", () => {
  const items = [make({ consent: "true" as unknown as boolean }), make({ published: 1 as unknown as boolean })];
  assert.equal(selectTestimonials(items, prod).length, 0);
});

test("sorted by order ascending, ties keep list position", () => {
  const items = [make({ name: "c", order: 3 }), make({ name: "a1", order: 1 }), make({ name: "a2", order: 1 }), make({ name: "b", order: 2 })];
  assert.deepEqual(selectTestimonials(items, prod).map((i) => i.name), ["a1", "a2", "b", "c"]);
});

test("adds the parsed video id and marks items as real", () => {
  const [r] = selectTestimonials([make()], prod);
  assert.equal(r.videoId, "abcDEF12345");
  assert.equal(r.isPlaceholder, false);
});

test("production returns nothing when nothing is approved, and never placeholders", () => {
  assert.deepEqual(selectTestimonials([], { dev: false, placeholders }), []);
  assert.deepEqual(selectTestimonials([make({ consent: false })], { dev: false, placeholders }), []);
});

test("development shows ordered placeholders only when no real item is approved", () => {
  const r = selectTestimonials([], { dev: true, placeholders });
  assert.deepEqual(r.map((i) => i.name), ["P2", "P1"]);
  assert.ok(r.every((i) => i.isPlaceholder));
  const withReal = selectTestimonials([make({ name: "real" })], { dev: true, placeholders });
  assert.deepEqual(withReal.map((i) => i.name), ["real"]);
});

test("invalid links are skipped; warn gets the index in dev only", () => {
  const items = [make({ name: "ok" }), make({ name: "bad", youtubeUrl: "https://evil.com/x" }), make({ name: "ok2", order: 2 })];
  const seen: number[] = [];
  const dev = selectTestimonials(items, { dev: true, placeholders, warn: (i) => seen.push(i) });
  assert.deepEqual(dev.map((i) => i.name), ["ok", "ok2"]);
  assert.deepEqual(seen, [1]);
  const seenProd: number[] = [];
  const out = selectTestimonials(items, { dev: false, placeholders, warn: (i) => seenProd.push(i) });
  assert.deepEqual(out.map((i) => i.name), ["ok", "ok2"]);
  assert.deepEqual(seenProd, []);
});

test("an unapproved item with a bad link is not warned about", () => {
  const seen: number[] = [];
  selectTestimonials([make({ consent: false, youtubeUrl: "nope" })], { dev: true, placeholders, warn: (i) => seen.push(i) });
  assert.deepEqual(seen, []);
});
