import assert from "node:assert/strict";
import { test } from "node:test";
import type { Program } from "../../src/lib/programs/options.ts";
import {
  isAllowedCover,
  parseFilter,
  resolveProgramCta,
  sortForIndex,
  toHomeCard,
  visibleFacts,
  whatsappMessage,
} from "../../src/lib/programs/view.ts";

const program = (over: Partial<Program> = {}): Program => ({
  title: "AI for Teachers workshop",
  slug: "teachers-workshop",
  audience: "teachers",
  status: "booking-now",
  ctaType: "workshop-modal",
  summary: "School and college teachers",
  description: "",
  outcomes: [],
  curriculum: [],
  facts: { format: "In person", duration: "Half a day", groupSize: "Up to 30", location: "" },
  priceText: "Contact us",
  order: 1,
  published: true,
  createdAt: "2026-11-05T00:00:00.000Z",
  updatedAt: "2026-11-05T00:00:00.000Z",
  ...over,
});

test("sortForIndex keeps stored order and moves coming-soon programs last", () => {
  const list = [
    program({ slug: "soon-a", status: "coming-soon", order: 1 }),
    program({ slug: "b", order: 3 }),
    program({ slug: "soon-b", status: "coming-soon", order: 2 }),
    program({ slug: "a", order: 4 }),
  ];
  assert.deepEqual(sortForIndex(list).map((p) => p.slug), ["b", "a", "soon-a", "soon-b"]);
  assert.equal(list[0].slug, "soon-a", "does not reorder the input");
});

test("visibleFacts skips blanks and keeps display order", () => {
  const facts = visibleFacts(program({ facts: { format: "Online", duration: "", groupSize: "10", location: "Lahore" } }));
  assert.deepEqual(facts.map((f) => f.label), ["Format", "Group size", "Location"]);
});

test("resolveProgramCta follows the call-to-action type", () => {
  const url = () => "https://wa.me/1";
  assert.deepEqual(resolveProgramCta(program(), url), { label: "Book a workshop", href: "/workshop?book=1", external: false });
  assert.deepEqual(resolveProgramCta(program({ ctaType: "register" }), url), { label: "Register interest", href: "/register", external: false });
  assert.deepEqual(resolveProgramCta(program({ ctaType: "whatsapp" }), url), { label: "Ask on WhatsApp", href: "https://wa.me/1", external: true });
});

test("resolveProgramCta names the program in the WhatsApp message and returns null with no number", () => {
  let sent = "";
  resolveProgramCta(program({ ctaType: "whatsapp", title: "Corporate teams" }), (m) => ((sent = m), "x"));
  assert.equal(sent, whatsappMessage({ title: "Corporate teams" }));
  assert.match(sent, /Corporate teams/);
  assert.equal(resolveProgramCta(program({ ctaType: "whatsapp" }), () => null), null);
});

test("toHomeCard keeps the home card's shape and uses the summary as its audience line", () => {
  const card = toHomeCard(program());
  assert.equal(card.id, "teachers-workshop");
  assert.equal(card.audience, "School and college teachers");
  assert.equal(card.statusLabel, "Booking now");
  assert.deepEqual(card.cta, { kind: "link", label: "Book a workshop", href: "/workshop?book=1" });
  assert.deepEqual(card.facts.map((f) => f.label), ["Format", "Duration", "Group size"]);
  assert.deepEqual(toHomeCard(program({ ctaType: "register" })).cta, { kind: "link", label: "Register interest", href: "/register" });
  assert.equal(toHomeCard(program({ ctaType: "whatsapp" })).cta.kind, "whatsapp");
});

test("isAllowedCover accepts site paths and Cloudinary only", () => {
  assert.equal(isAllowedCover("/covers/a.jpg"), true);
  assert.equal(isAllowedCover("https://res.cloudinary.com/x/a.jpg"), true);
  for (const bad of [undefined, "", "//evil.example/a.jpg", "https://evil.example/a.jpg", "http://res.cloudinary.com/a.jpg", "javascript:alert(1)"]) {
    assert.equal(isAllowedCover(bad), false, String(bad));
  }
});

test("parseFilter reads known values and treats everything else as all", () => {
  for (const v of ["teachers", "students", "college", "online", "corporate"]) assert.equal(parseFilter(`?for=${v}`), v);
  assert.equal(parseFilter(""), "all");
  assert.equal(parseFilter("?for=xyz"), "all");
  assert.equal(parseFilter("?for="), "all");
  assert.equal(parseFilter("?for=school-students"), "all");
  assert.equal(parseFilter("?for=teachers&for=online"), "teachers");
  assert.equal(parseFilter("?other=1&for=online"), "online");
});
