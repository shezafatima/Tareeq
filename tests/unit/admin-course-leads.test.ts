import assert from "node:assert/strict";
import { test } from "node:test";
import {
  categoryFor,
  categoryOptions,
  courseIdsByCategory,
  courseLinkFor,
  courseOptions,
  type CourseRef,
} from "../../src/lib/admin/course-leads.ts";

// specs/026-split-submissions data-model.md "Snapshot states" and research R7.

const A = "aaaaaaaaaaaaaaaaaaaaaaaa";
const B = "bbbbbbbbbbbbbbbbbbbbbbbb";
const X = "111111111111111111111111";
const Y = "222222222222222222222222";
const courses: CourseRef[] = [
  { id: A, title: "Prompting basics", categoryId: Y, categoryName: "Writing" },
  { id: B, title: "AI for teachers", categoryId: X, categoryName: "Teaching" },
];
const byId = new Map(courses.map((c) => [c.id, c]));

test("a snapshot wins, even after the course moved category", () => {
  assert.equal(categoryFor({ courseId: A, categoryId: X, categoryName: "Teaching" }, byId), "Teaching");
});

test("a null snapshot shows a dash and never falls back", () => {
  assert.equal(categoryFor({ courseId: A, categoryId: null, categoryName: null }, byId), null);
});

test("older records without a snapshot use the live course, or a dash when it is gone", () => {
  assert.equal(categoryFor({ courseId: A }, byId), "Writing");
  assert.equal(categoryFor({ courseId: "cccccccccccccccccccccccc" }, byId), null);
});

test("Not sure yet is always a dash", () => {
  assert.equal(categoryFor({ courseId: "not-sure", categoryId: X, categoryName: "Teaching" }, byId), null);
  assert.equal(categoryFor({ courseId: "not-sure" }, byId), null);
});

test("course link: edit, removed (incl. legacy ids) or none", () => {
  assert.deepEqual(courseLinkFor(A, byId), { kind: "edit", href: `/admin/courses/${A}/edit` });
  assert.deepEqual(courseLinkFor("cccccccccccccccccccccccc", byId), { kind: "removed" });
  assert.deepEqual(courseLinkFor("ai-basics", byId), { kind: "removed" });
  assert.deepEqual(courseLinkFor("not-sure", byId), { kind: "none" });
});

test("category options: current first, then snapshot-only ones marked removed, no duplicates", () => {
  const opts = categoryOptions(
    [{ id: X, name: "Teaching" }, { id: Y, name: "Writing" }],
    [{ id: X, name: "Old name" }, { id: "333333333333333333333333", name: "Robotics" }, { id: "444444444444444444444444", name: "Art" }],
  );
  assert.deepEqual(opts.map((o) => o.label), ["Teaching", "Writing", "Art (removed)", "Robotics (removed)"]);
});

test("course options are sorted by title and end with Not sure yet", () => {
  assert.deepEqual(courseOptions(courses), [
    { value: B, label: "AI for teachers" },
    { value: A, label: "Prompting basics" },
    { value: "not-sure", label: "Not sure yet" },
  ]);
});

test("course ids grouped by category", () => {
  const map = courseIdsByCategory(courses);
  assert.deepEqual(map.get(X), [B]);
  assert.deepEqual(map.get(Y), [A]);
});
