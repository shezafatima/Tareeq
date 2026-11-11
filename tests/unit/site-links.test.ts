import assert from "node:assert/strict";
import { test } from "node:test";
import { contactFallbackHref, whatsappMessage, whatsappUrl } from "../../src/lib/site.ts";

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
