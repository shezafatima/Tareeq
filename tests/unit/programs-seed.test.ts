import assert from "node:assert/strict";
import { test } from "node:test";
import { SLUG_PATTERN } from "../../src/lib/programs/options.ts";
import { programSeeds } from "../../scripts/data/programs.seed.ts";
import { onlineCoursesCard } from "../../src/content/online-courses.ts";
import { onlineCoursesHref } from "../../src/lib/site.ts";

test("seeds the four programs in the agreed mapping", () => {
  assert.deepEqual(
    programSeeds.map((p) => [p.slug, p.audience, p.status, p.ctaType, p.order]),
    [
      ["teachers-workshop", "teachers", "booking-now", "workshop-modal", 1],
      ["student-workshops", "school-students", "booking-now", "workshop-modal", 2],
      ["college-university", "college", "coming-soon", "whatsapp", 3],
      ["corporate-teams", "corporate", "coming-soon", "whatsapp", 4],
    ],
  );
});

test("slugs are unique and well formed", () => {
  const slugs = programSeeds.map((p) => p.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const slug of slugs) assert.match(slug, SLUG_PATTERN);
});

test("every program is published and has its content", () => {
  for (const p of programSeeds) {
    assert.equal(p.published, true, p.slug);
    assert.ok(p.summary && p.description && p.priceText, p.slug);
    assert.ok(p.outcomes.length > 0, p.slug);
    assert.ok(p.curriculum.length >= 3 && p.curriculum.length <= 4, p.slug);
  }
});

test("draft copy avoids the words the brand rules out", () => {
  assert.doesNotMatch(JSON.stringify(programSeeds), /empower|unlock|revolutioni[sz]e/i);
});

test("online courses are a fixed card that links through the one constant, not a stored program", () => {
  assert.equal(programSeeds.some((p) => p.slug === "online-courses" || (p.audience as string) === "online"), false);
  assert.equal(onlineCoursesCard.title, "Online courses");
  assert.deepEqual(onlineCoursesCard.cta, { kind: "link", label: "Register interest", href: onlineCoursesHref });
  assert.equal(onlineCoursesHref, "/register");
});
