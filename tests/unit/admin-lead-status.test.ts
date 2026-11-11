import assert from "node:assert/strict";
import { test } from "node:test";
import { statusLabels, TYPE_NOUN } from "../../src/lib/admin/lead-status.ts";

// FR-013: "booked" reads "Enrolled" for course registrations only.

test("courses say Enrolled, workshops say Booked", () => {
  assert.equal(statusLabels("course").booked, "Enrolled");
  assert.equal(statusLabels("workshop").booked, "Booked");
});

test("the other labels are the same for both types", () => {
  for (const s of ["new", "contacted", "closed"] as const) assert.equal(statusLabels("course")[s], statusLabels("workshop")[s]);
  assert.deepEqual(Object.keys(statusLabels("course")), ["new", "contacted", "booked", "closed"]);
});

test("type nouns", () => {
  assert.equal(TYPE_NOUN.workshop, "Workshop request");
  assert.equal(TYPE_NOUN.course, "Course registration");
});
