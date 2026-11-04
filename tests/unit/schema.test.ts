import assert from "node:assert/strict";
import { test } from "node:test";
import { courseSchema, MESSAGES, pickValues, toFieldErrors, workshopSchema } from "../../src/lib/leads/schema.ts";

const NOW = new Date("2026-11-03T10:00:00Z");
const KEY = "3b241101-e2bb-4255-8caf-4136c566a962";

const workshop = {
  role: "school",
  fullName: "  Test Person  ",
  phone: "0300 1234567",
  email: " Test@Example.COM ",
  organization: "Test School",
  participants: "40",
  preferredMonth: "2026-12",
  message: "",
  consent: "yes",
  submissionKey: KEY,
};

const course = {
  fullName: "Test Person",
  phone: "+447700900123",
  email: "test@example.com",
  courseId: "not-sure",
  level: "beginner",
  ageGroup: "under-18",
  message: "Hello",
  consent: "yes",
  submissionKey: KEY,
};

const COURSE_IDS = ["ai-basics", "not-sure"];

function firstError(result: ReturnType<ReturnType<typeof workshopSchema>["safeParse"]> | ReturnType<ReturnType<typeof courseSchema>["safeParse"]>, field: string) {
  assert.equal(result.success, false);
  return toFieldErrors(result.error!)[field as keyof ReturnType<typeof toFieldErrors>];
}

test("valid workshop parses and normalises", () => {
  const r = workshopSchema(NOW).safeParse(workshop);
  assert.ok(r.success);
  assert.equal(r.data.phone, "+923001234567");
  assert.equal(r.data.email, "test@example.com");
  assert.equal(r.data.fullName, "Test Person");
  assert.equal(r.data.participants, 40);
  assert.equal(r.data.preferredMonth, "2026-12");
});

test("city is not a form field: a city sent by the browser is dropped", () => {
  const r = workshopSchema(NOW).safeParse({ ...workshop, city: "Lahore" });
  assert.ok(r.success);
  assert.equal("city" in r.data, false);
});

test("workshop email is optional, but must be valid when given", () => {
  const none = workshopSchema(NOW).safeParse({ ...workshop, email: "" });
  assert.ok(none.success);
  assert.equal(none.data.email, "");
  const bad = workshopSchema(NOW).safeParse({ ...workshop, email: "name@" });
  assert.equal(firstError(bad, "email"), MESSAGES.email);
});

test("course email is still required", () => {
  const r = courseSchema(COURSE_IDS).safeParse({ ...course, email: "" });
  assert.equal(firstError(r, "email"), MESSAGES.email);
});

test("empty preferred month becomes null", () => {
  const r = workshopSchema(NOW).safeParse({ ...workshop, preferredMonth: "" });
  assert.ok(r.success);
  assert.equal(r.data.preferredMonth, null);
});

test("valid course parses (under 18 allowed)", () => {
  const r = courseSchema(COURSE_IDS).safeParse(course);
  assert.ok(r.success);
  assert.equal(r.data.ageGroup, "under-18");
});

const workshopCases: [string, Record<string, string>, string][] = [
  ["missing consent", { consent: "" }, "consent"],
  ["invalid phone", { phone: "12345" }, "phone"],
  ["invalid email", { email: "name@" }, "email"],
  ["missing name", { fullName: "" }, "fullName"],
  ["name too long", { fullName: "a".repeat(101) }, "fullName"],
  ["participants 0", { participants: "0" }, "participants"],
  ["participants decimal", { participants: "1.5" }, "participants"],
  ["participants text", { participants: "abc" }, "participants"],
  ["participants 1001", { participants: "1001" }, "participants"],
  ["message too long", { message: "a".repeat(1001) }, "message"],
  ["month outside list", { preferredMonth: "2030-01" }, "preferredMonth"],
  ["role not in enum", { role: "parent" }, "role"],
  ["student group is no longer a role", { role: "student-group" }, "role"],
  ["missing role", { role: "" }, "role"],
];

for (const [name, patch, field] of workshopCases) {
  test(`workshop rejects: ${name}`, () => {
    const r = workshopSchema(NOW).safeParse({ ...workshop, ...patch });
    assert.equal(firstError(r, field), MESSAGES[field as keyof typeof MESSAGES]);
  });
}

test("course rejects a course not in the list", () => {
  const r = courseSchema(COURSE_IDS).safeParse({ ...course, courseId: "made-up" });
  assert.equal(firstError(r, "courseId"), MESSAGES.courseId);
});

test("course rejects missing level and age group", () => {
  const r = courseSchema(COURSE_IDS).safeParse({ ...course, level: "", ageGroup: "" });
  assert.equal(firstError(r, "level"), MESSAGES.level);
  assert.equal(firstError(r, "ageGroup"), MESSAGES.ageGroup);
});

test("pickValues keeps only listed fields and drops the honeypot", () => {
  const fd = new FormData();
  fd.set("fullName", "  A Name ");
  fd.set("website", "spam");
  fd.set("$ACTION_ID_x", "1");
  fd.set("extra", "nope");
  const v = pickValues(fd, ["fullName", "email"]);
  assert.deepEqual(v, { fullName: "A Name", email: "" });
});
