import assert from "node:assert/strict";
import { test } from "node:test";
import { MESSAGES, parseTestimonial, type TestimonialFormValues } from "../../src/lib/admin/testimonials-schema.ts";

const ID = "abcDEF12345";
const make = (over: Partial<TestimonialFormValues> = {}): TestimonialFormValues => ({
  youtubeUrl: `https://www.youtube.com/shorts/${ID}`,
  name: "A Person",
  role: "Teacher",
  organization: "",
  quote: "It was easy to follow.",
  consent: true,
  published: true,
  order: "1",
  ...over,
});

test("accepts Shorts, watch (with extra params) and youtu.be links and derives the id", () => {
  for (const url of [`https://www.youtube.com/shorts/${ID}`, `https://www.youtube.com/watch?v=${ID}&t=30s`, `https://youtu.be/${ID}?si=x`]) {
    const r = parseTestimonial(make({ youtubeUrl: url }));
    assert.equal(r.success, true, url);
    if (r.success) assert.equal(r.data.youtubeId, ID);
  }
});

test("rejects other links, an empty link and a bad id", () => {
  for (const url of ["https://example.com", "", `https://youtu.be/${ID.slice(1)}`]) {
    const r = parseTestimonial(make({ youtubeUrl: url }));
    assert.equal(r.success, false, url);
    if (!r.success) assert.equal(r.errors.youtubeUrl, MESSAGES.url);
  }
});

test("quote: 140 passes, 141 fails, line breaks fail", () => {
  assert.equal(parseTestimonial(make({ quote: "a".repeat(140) })).success, true);
  const long = parseTestimonial(make({ quote: "a".repeat(141) }));
  assert.equal(long.success, false);
  if (!long.success) assert.equal(long.errors.quote, MESSAGES.quote);
  assert.equal(parseTestimonial(make({ quote: "one\ntwo" })).success, false);
});

test("name, role and quote are required; organization may be blank", () => {
  const r = parseTestimonial(make({ name: " ", role: "", quote: "" }));
  assert.equal(r.success, false);
  if (!r.success) {
    assert.ok(r.errors.name && r.errors.role && r.errors.quote);
    assert.equal(r.errors.organization, undefined);
  }
  assert.equal(parseTestimonial(make({ organization: "" })).success, true);
});

test("publishing needs consent", () => {
  const bad = parseTestimonial(make({ consent: false, published: true }));
  assert.equal(bad.success, false);
  if (!bad.success) assert.equal(bad.errors.published, MESSAGES.consentRequired);
  assert.equal(parseTestimonial(make({ consent: true, published: true })).success, true);
  assert.equal(parseTestimonial(make({ consent: false, published: false })).success, true);
  assert.equal(parseTestimonial(make({ consent: true, published: false })).success, true);
});

test("order must be a whole number in range", () => {
  for (const o of ["", "1.5", "10000", "abc"]) assert.equal(parseTestimonial(make({ order: o })).success, false, o);
  const r = parseTestimonial(make({ order: "-3" }));
  assert.equal(r.success, true);
  if (r.success) assert.equal(r.data.order, -3);
});
