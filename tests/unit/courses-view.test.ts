import assert from "node:assert/strict";
import { test } from "node:test";
import type { Course, CourseCategory } from "../../src/lib/courses/options.ts";
import {
  confirmationVariant,
  courseFacts,
  isListed,
  parseCourseFilters,
  sortCourses,
  toCourseOptions,
} from "../../src/lib/courses/view.ts";

const course = (over: Partial<Course>): Course => ({
  id: over.slug ?? "c",
  title: "Course",
  slug: "course",
  category: { name: "AI Basics", slug: "ai-basics" },
  level: "beginner",
  summary: "s",
  description: "",
  outcomes: [],
  syllabus: [],
  format: "live",
  durationText: "4 weeks",
  startDateText: "",
  priceText: "",
  enrollmentStatus: "open",
  featured: false,
  order: 0,
  published: true,
  createdAt: "",
  updatedAt: "",
  ...over,
});

const categories: CourseCategory[] = [
  { id: "1", name: "For Teachers", slug: "for-teachers", description: "", order: 1 },
  { id: "2", name: "AI Basics", slug: "ai-basics", description: "", order: 2 },
];

test("sort puts featured first, then order, then title", () => {
  const sorted = sortCourses([
    course({ slug: "b", title: "B", order: 1 }),
    course({ slug: "a", title: "A", order: 1 }),
    course({ slug: "f", title: "Z", order: 9, featured: true }),
    course({ slug: "c", title: "C", order: 0 }),
  ]);
  assert.deepEqual(sorted.map((c) => c.slug), ["f", "c", "a", "b"]);
});

test("isListed excludes closed and unpublished courses", () => {
  assert.equal(isListed(course({})), true);
  assert.equal(isListed(course({ enrollmentStatus: "coming-soon" })), true);
  assert.equal(isListed(course({ enrollmentStatus: "closed" })), false);
  assert.equal(isListed(course({ published: false })), false);
});

test("parseCourseFilters keeps known values and drops unknown ones", () => {
  assert.deepEqual(parseCourseFilters("?category=ai-basics&level=advanced", ["ai-basics"]), { category: "ai-basics", level: "advanced" });
  assert.deepEqual(parseCourseFilters("?category=nope&level=expert", ["ai-basics"]), {});
  assert.deepEqual(parseCourseFilters("", ["ai-basics"]), {});
});

test("courseFacts lists only facts with a value", () => {
  assert.deepEqual(
    courseFacts(course({ startDateText: "", priceText: "" })).map((f) => f.label),
    ["Format", "Duration", "Level"],
  );
  assert.deepEqual(
    courseFacts(course({ startDateText: "1 Dec", priceText: "Free" })).map((f) => f.label),
    ["Format", "Duration", "Starts", "Price", "Level"],
  );
});

test("courseFacts leaves the old price text out when structured pricing is set (specs/034)", () => {
  assert.deepEqual(
    courseFacts(course({ startDateText: "1 Dec", priceText: "Old text", pricing: { mode: "free" } })).map((f) => f.label),
    ["Format", "Duration", "Starts", "Level"],
  );
});

test("toCourseOptions groups by category order, puts uncategorised last and leaves closed out", () => {
  const options = toCourseOptions(
    [
      course({ slug: "basics-1", title: "Basics 1", order: 1 }),
      course({ slug: "orphan", title: "Orphan", category: null }),
      course({ slug: "teach-1", title: "Teach 1", category: { name: "For Teachers", slug: "for-teachers" }, enrollmentStatus: "coming-soon" }),
      course({ slug: "closed", title: "Closed", enrollmentStatus: "closed" }),
      course({ slug: "hidden", title: "Hidden", published: false }),
      course({ slug: "basics-0", title: "Basics 0", order: 0 }),
    ],
    categories,
  );
  assert.deepEqual(
    options.map((o) => [o.slug, o.group, o.status]),
    [
      ["teach-1", "For Teachers", "coming-soon"],
      ["basics-0", "AI Basics", "open"],
      ["basics-1", "AI Basics", "open"],
      ["orphan", undefined, "open"],
    ],
  );
});

test("confirmationVariant is open only for an open course", () => {
  assert.equal(confirmationVariant({ status: "open" }), "open");
  assert.equal(confirmationVariant({ status: "coming-soon" }), "waitlist");
  assert.equal(confirmationVariant({}), "waitlist");
  assert.equal(confirmationVariant(undefined), "waitlist");
});
