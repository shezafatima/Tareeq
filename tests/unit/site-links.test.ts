import assert from "node:assert/strict";
import { test } from "node:test";
import { contactFallbackHref, navItems, navItemsFor, whatsappMessage, whatsappUrl } from "../../src/lib/site.ts";

test("builds a wa.me link from an E.164 number and encodes the message", () => {
  assert.equal(whatsappUrl("+923001234567", "Hi & bye"), "https://wa.me/923001234567?text=Hi%20%26%20bye");
});

test("uses the default message when none is given", () => {
  assert.equal(whatsappUrl("+923001234567"), `https://wa.me/923001234567?text=${encodeURIComponent(whatsappMessage)}`);
});

test("returns null for a missing or malformed number", () => {
  assert.equal(whatsappUrl(null), null);
  assert.equal(whatsappUrl("+123"), null);
  assert.equal(whatsappUrl("+1234567890123456"), null);
});

test("contact fallback goes to the email row when there is an email, else the contact block", () => {
  assert.equal(contactFallbackHref("a@b.co"), "#footer-email");
  assert.equal(contactFallbackHref(null), "#footer-contact");
});

test("the navigation is Programs, Our Way, Courses", () => {
  assert.deepEqual(navItemsFor({ blog: false }).map((i) => i.href), ["/programs", "/our-way", "/courses"]);
  assert.deepEqual(navItemsFor({ blog: false }), navItems);
});

// specs/033-admin-blog FR-023
test("Blog comes last, and only once a post is published", () => {
  const withBlog = navItemsFor({ blog: true });
  assert.deepEqual(withBlog.map((i) => i.href), ["/programs", "/our-way", "/courses", "/blog"]);
  assert.deepEqual(withBlog[withBlog.length - 1], { label: "Blog", href: "/blog" });
});

test("Gallery is not in the navigation: the Workshop page links to it", () => {
  for (const blog of [false, true]) assert.ok(!navItemsFor({ blog }).some((i) => i.href === "/gallery"));
});

test("navItemsFor never changes the shared base list", () => {
  const before = JSON.stringify(navItems);
  navItemsFor({ blog: true });
  assert.equal(JSON.stringify(navItems), before);
});
