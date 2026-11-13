import assert from "node:assert/strict";
import { test } from "node:test";
import type { Program } from "../../src/lib/programs/options.ts";
import { pickWorkshopPrograms } from "../../src/lib/programs/workshop.ts";

// specs/034-pricing-certificate-announcement FR-010: workshop prices are picked by audience, never by slug.

const program = (over: Partial<Program>): Program => ({
  title: "Program",
  slug: "program",
  audience: "teachers",
  status: "booking-now",
  ctaType: "workshop-modal",
  summary: "s",
  description: "",
  outcomes: [],
  curriculum: [],
  facts: { format: "", duration: "", groupSize: "", location: "" },
  priceText: "",
  order: 0,
  published: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...over,
});

const teachers = program({ title: "For teachers", slug: "x-1", audience: "teachers", pricing: { mode: "show", amount: 8000 } });
const students = program({ title: "For students", slug: "x-2", audience: "school-students", pricing: { mode: "contact" } });

test("picks the teachers and school-students programs, teachers first", () => {
  const out = pickWorkshopPrograms([students, teachers]);
  assert.deepEqual(
    out.map((e) => e.slug),
    ["x-1", "x-2"],
  );
  assert.deepEqual(out[0], { title: "For teachers", slug: "x-1", price: { kind: "amount", current: "Rs 8,000" } });
  assert.deepEqual(out[1].price, { kind: "contact" });
});

test("the slug does not matter, only the audience", () => {
  const renamed = { ...teachers, slug: "something-else", title: "Renamed" };
  assert.equal(pickWorkshopPrograms([renamed])[0].slug, "something-else");
});

test("other audiences are ignored", () => {
  const college = program({ audience: "college", pricing: { mode: "free" } });
  const corporate = program({ audience: "corporate", pricing: { mode: "free" } });
  assert.deepEqual(pickWorkshopPrograms([college, corporate]), []);
});

test("a program without structured pricing is omitted, even if it has price text", () => {
  const noPricing = { ...teachers, pricing: undefined, priceText: "Contact us" };
  assert.deepEqual(pickWorkshopPrograms([noPricing, students]).map((e) => e.slug), ["x-2"]);
  assert.deepEqual(pickWorkshopPrograms([noPricing, { ...students, pricing: undefined }]), []);
});

test("unpublished programs are skipped", () => {
  assert.deepEqual(pickWorkshopPrograms([{ ...teachers, published: false }, students]).map((e) => e.slug), ["x-2"]);
});

test("when two programs share an audience the first in the given order wins", () => {
  const second = { ...teachers, slug: "x-3", title: "Second teachers" };
  assert.deepEqual(pickWorkshopPrograms([teachers, second]).map((e) => e.slug), ["x-1"]);
  assert.deepEqual(pickWorkshopPrograms([second, teachers]).map((e) => e.slug), ["x-3"]);
});

test("a higher-ranked program without pricing does not block a later one of the same audience", () => {
  const unpriced = { ...teachers, slug: "x-9", pricing: undefined };
  assert.deepEqual(pickWorkshopPrograms([unpriced, teachers]).map((e) => e.slug), ["x-1"]);
});

test("an empty list gives no entries", () => {
  assert.deepEqual(pickWorkshopPrograms([]), []);
});
