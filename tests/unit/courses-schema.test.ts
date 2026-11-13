import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MESSAGES,
  parseCategory,
  parseCourse,
  type CategoryFormValues,
  type CourseFormValues,
} from "../../src/lib/admin/courses-schema.ts";
import { EMPTY_PRICING } from "../../src/lib/pricing/rules.ts";

const valid = (): CourseFormValues => ({
  title: "Intro to AI",
  slug: "intro-to-ai",
  slugAuto: true,
  category: "64b7f0c2a1b2c3d4e5f60718",
  level: "beginner",
  format: "live",
  enrollmentStatus: "open",
  summary: "A gentle start.",
  description: "## About\n\nText.",
  outcomes: ["Write a good prompt"],
  syllabus: [{ title: "Prompting", description: "The basics" }],
  durationText: "4 weeks",
  startDateText: "",
  priceText: "PKR 5,000",
  pricing: EMPTY_PRICING,
  coverImageUrl: "",
  featured: false,
  order: "3",
  published: true,
});

const errorsOf = (v: CourseFormValues) => {
  const r = parseCourse(v);
  return r.success ? {} : r.errors;
};

test("pricing is checked with the course (specs/034)", () => {
  const ok = parseCourse({ ...valid(), pricing: { ...EMPTY_PRICING, mode: "show", amount: "5000", originalAmount: "7000" } });
  assert.equal(ok.success, true);
  if (ok.success) assert.deepEqual(ok.data.pricing, { mode: "show", amount: 5000, originalAmount: 7000 });

  const notSet = parseCourse(valid());
  assert.equal(notSet.success, true);
  if (notSet.success) assert.equal(notSet.data.pricing, null);

  assert.ok(errorsOf({ ...valid(), pricing: { ...EMPTY_PRICING, mode: "show", amount: "0" } })["pricing.amount"]);
  assert.ok(
    errorsOf({ ...valid(), pricing: { ...EMPTY_PRICING, mode: "show", amount: "5000", originalAmount: "5000" } })["pricing.originalAmount"],
  );
});

test("pricing errors are reported together with other field errors", () => {
  const errors = errorsOf({ ...valid(), title: "  ", pricing: { ...EMPTY_PRICING, mode: "show", amount: "" } });
  assert.ok(errors.title);
  assert.ok(errors["pricing.amount"]);
});

test("a request with no pricing at all is treated as not set", () => {
  const { pricing, ...rest } = valid();
  void pricing;
  const r = parseCourse(rest as unknown as CourseFormValues);
  assert.equal(r.success, true);
  if (r.success) assert.equal(r.data.pricing, null);
});

test("a complete course parses and order text becomes a number", () => {
  const r = parseCourse(valid());
  assert.equal(r.success, true);
  if (r.success) {
    assert.equal(r.data.order, 3);
    assert.equal(r.data.slugAuto, true);
  }
});

test("each required field reports its own message", () => {
  assert.equal(errorsOf({ ...valid(), title: " " }).title, MESSAGES.title);
  assert.equal(errorsOf({ ...valid(), summary: "" }).summary, MESSAGES.summary);
  assert.equal(errorsOf({ ...valid(), slug: "Bad Slug" }).slug, MESSAGES.slug);
  assert.equal(errorsOf({ ...valid(), level: "expert" as never }).level, MESSAGES.level);
  assert.equal(errorsOf({ ...valid(), format: "tv" as never }).format, MESSAGES.format);
  assert.equal(errorsOf({ ...valid(), enrollmentStatus: "maybe" as never }).enrollmentStatus, MESSAGES.enrollmentStatus);
});

test("a malformed category id fails", () => {
  assert.equal(errorsOf({ ...valid(), category: "" }).category, MESSAGES.category);
  assert.equal(errorsOf({ ...valid(), category: "not-an-id" }).category, MESSAGES.category);
});

test("a protocol-relative or http cover URL fails, https and site paths pass", () => {
  assert.equal(errorsOf({ ...valid(), coverImageUrl: "//evil.example/x.png" }).coverImageUrl, MESSAGES.cover);
  assert.equal(errorsOf({ ...valid(), coverImageUrl: "http://x.example/a.png" }).coverImageUrl, MESSAGES.cover);
  assert.equal(parseCourse({ ...valid(), coverImageUrl: "https://res.cloudinary.com/a.png" }).success, true);
  assert.equal(parseCourse({ ...valid(), coverImageUrl: "/robot.png" }).success, true);
});

test("blank outcome and syllabus rows are dropped, not errors", () => {
  const r = parseCourse({ ...valid(), outcomes: ["One", "  ", ""], syllabus: [{ title: "", description: "" }, { title: "Two", description: "" }] });
  assert.equal(r.success, true);
  if (r.success) {
    assert.deepEqual(r.data.outcomes, ["One"]);
    assert.deepEqual(r.data.syllabus, [{ title: "Two", description: "" }]);
  }
});

test("a syllabus item with only a description needs a title", () => {
  assert.equal(errorsOf({ ...valid(), syllabus: [{ title: "", description: "x" }] })["syllabus.0.title"], MESSAGES.itemTitle);
});

test("order must be a whole number in range", () => {
  assert.equal(errorsOf({ ...valid(), order: "" }).order, MESSAGES.order);
  assert.equal(errorsOf({ ...valid(), order: "1.5" }).order, MESSAGES.order);
  assert.equal(errorsOf({ ...valid(), order: "10000" }).order, MESSAGES.order);
});

test("parseCourse never throws on junk input", () => {
  assert.equal(parseCourse(undefined as never).success, false);
  assert.equal(parseCourse({} as never).success, false);
});

const validCategory = (): CategoryFormValues => ({ name: "AI Basics", slug: "ai-basics", description: "", order: "1" });

test("a category validates name, slug and order", () => {
  assert.equal(parseCategory(validCategory()).success, true);
  const bad = parseCategory({ ...validCategory(), name: "", slug: "No", order: "x" });
  assert.equal(bad.success, false);
  if (!bad.success) {
    assert.equal(bad.errors.name, MESSAGES.categoryName);
    assert.equal(bad.errors.slug, MESSAGES.slug);
    assert.equal(bad.errors.order, MESSAGES.order);
  }
  assert.equal(parseCategory(undefined as never).success, false);
});
