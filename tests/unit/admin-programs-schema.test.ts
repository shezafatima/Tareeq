import assert from "node:assert/strict";
import { test } from "node:test";
import {
  dropEmptyRows,
  LIMITS,
  parseProgram,
  slugify,
  type ProgramFormValues,
} from "../../src/lib/admin/programs-schema.ts";
import { EMPTY_PRICING } from "../../src/lib/pricing/rules.ts";

const valid = (): ProgramFormValues => ({
  title: "Teachers workshop",
  slug: "teachers-workshop",
  audience: "teachers",
  status: "booking-now",
  ctaType: "workshop-modal",
  summary: "A hands-on day for teachers.",
  description: "## About\n\nText.",
  outcomes: ["Plan a lesson with AI"],
  curriculum: [{ title: "Prompting", description: "The basics" }],
  facts: { format: "In person", duration: "1 day", groupSize: "20", location: "Lahore" },
  priceText: "On request",
  pricing: EMPTY_PRICING,
  coverImageUrl: "",
  order: "2",
  published: true,
});

const errorsOf = (v: ProgramFormValues) => {
  const r = parseProgram(v);
  return r.success ? {} : r.errors;
};

test("pricing is checked with the program (specs/034)", () => {
  const ok = parseProgram({ ...valid(), pricing: { ...EMPTY_PRICING, mode: "contact" } });
  assert.equal(ok.success, true);
  if (ok.success) assert.deepEqual(ok.data.pricing, { mode: "contact" });

  const notSet = parseProgram(valid());
  assert.equal(notSet.success, true);
  if (notSet.success) assert.equal(notSet.data.pricing, null);

  assert.ok(errorsOf({ ...valid(), pricing: { ...EMPTY_PRICING, mode: "show", amount: "-1" } })["pricing.amount"]);
  assert.ok(
    errorsOf({ ...valid(), pricing: { ...EMPTY_PRICING, mode: "show", amount: "5000", originalAmount: "4000" } })["pricing.originalAmount"],
  );
  const both = errorsOf({ ...valid(), title: " ", pricing: { ...EMPTY_PRICING, mode: "show" } });
  assert.ok(both.title && both["pricing.amount"]);
});

test("a request with no pricing at all is treated as not set", () => {
  const { pricing, ...rest } = valid();
  void pricing;
  const r = parseProgram(rest as unknown as ProgramFormValues);
  assert.equal(r.success, true);
  if (r.success) assert.equal(r.data.pricing, null);
});

test("a complete program passes and order becomes a number", () => {
  const r = parseProgram(valid());
  assert.equal(r.success, true);
  if (r.success) assert.equal(r.data.order, 2);
});

test("required text is trimmed and enforced", () => {
  assert.ok(errorsOf({ ...valid(), title: "   " }).title);
  assert.ok(errorsOf({ ...valid(), summary: "" }).summary);
  assert.ok(errorsOf({ ...valid(), title: "x".repeat(LIMITS.title + 1) }).title);
  assert.ok(errorsOf({ ...valid(), summary: "x".repeat(LIMITS.summary + 1) }).summary);
  assert.ok(errorsOf({ ...valid(), description: "x".repeat(LIMITS.description + 1) }).description);
});

test("slug must be lowercase words with single hyphens", () => {
  for (const bad of ["Teachers", "two  words", "-lead", "trail-", "a--b", "", "x".repeat(81)]) {
    assert.ok(errorsOf({ ...valid(), slug: bad }).slug, `should reject "${bad}"`);
  }
  assert.equal(errorsOf({ ...valid(), slug: "a1-b2" }).slug, undefined);
});

test("choices must be one of the allowed values", () => {
  assert.ok(errorsOf({ ...valid(), audience: "kids" as never }).audience);
  assert.ok(errorsOf({ ...valid(), status: "soon" as never }).status);
  assert.ok(errorsOf({ ...valid(), ctaType: "email" as never }).ctaType);
});

test("cover image must be https, a site path, or empty", () => {
  assert.equal(errorsOf({ ...valid(), coverImageUrl: "https://example.com/a.jpg" }).coverImageUrl, undefined);
  assert.equal(errorsOf({ ...valid(), coverImageUrl: "/images/a.jpg" }).coverImageUrl, undefined);
  for (const bad of ["http://example.com/a.jpg", "//evil.example/a.jpg", "javascript:alert(1)", "example.com/a.jpg"]) {
    assert.ok(errorsOf({ ...valid(), coverImageUrl: bad }).coverImageUrl, `should reject ${bad}`);
  }
});

test("order must be a whole number in range", () => {
  for (const bad of ["", "abc", "1.5", "10000", "-10000"]) assert.ok(errorsOf({ ...valid(), order: bad }).order, `reject ${bad}`);
  assert.equal(errorsOf({ ...valid(), order: "-3" }).order, undefined);
  assert.equal(errorsOf({ ...valid(), order: " 7 " }).order, undefined);
});

test("blank outcome and curriculum rows are dropped, partial ones are errors", () => {
  const withBlanks = { ...valid(), outcomes: ["Real", "  ", ""], curriculum: [{ title: "", description: "" }, { title: "Real", description: "" }] };
  assert.deepEqual(dropEmptyRows(withBlanks).outcomes, ["Real"]);
  assert.equal(dropEmptyRows(withBlanks).curriculum.length, 1);
  assert.equal(parseProgram(withBlanks).success, true);
  const partial = errorsOf({ ...valid(), curriculum: [{ title: "", description: "has text but no title" }] });
  assert.ok(partial["curriculum.0.title"]);
});

test("errors are keyed by the form field path", () => {
  const e = errorsOf({ ...valid(), outcomes: ["x".repeat(LIMITS.outcome + 1)], facts: { ...valid().facts, duration: "x".repeat(121) } });
  assert.ok(e["outcomes.0"]);
  assert.ok(e["facts.duration"]);
});

test("slugify makes short, clean addresses", () => {
  assert.equal(slugify("Teachers Workshop"), "teachers-workshop");
  assert.equal(slugify("  AI for College & University!  "), "ai-for-college-university");
  assert.equal(slugify("Café Série"), "cafe-serie");
  assert.equal(slugify("---"), "");
  assert.equal(slugify("a".repeat(120)).length, 80);
  assert.ok(!slugify("x".repeat(79) + " y").endsWith("-"));
});
