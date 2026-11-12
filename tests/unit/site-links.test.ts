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

test("navItemsFor lists Gallery third only when a gallery is public", () => {
  assert.deepEqual(navItemsFor({ gallery: false }), navItems);
  const withGallery = navItemsFor({ gallery: true });
  assert.equal(withGallery.length, navItems.length + 1);
  assert.equal(withGallery[2].href, "/gallery");
  assert.equal(new Set(withGallery.map((i) => i.href)).size, withGallery.length);
});
