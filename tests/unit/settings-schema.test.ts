import assert from "node:assert/strict";
import { test } from "node:test";
import { PHONE_ERROR } from "../../src/lib/leads/phone.ts";
import { EMPTY_SETTINGS, MESSAGES, parseSettings, type SettingsFormValues } from "../../src/lib/admin/settings-schema.ts";

const allFallbacks = { whatsappNumber: true, email: true, notifyEmail: true };
const noFallbacks = { whatsappNumber: false, email: false, notifyEmail: false };

const form = (patch: Partial<SettingsFormValues> & { social?: Partial<SettingsFormValues["socialLinks"]> } = {}): SettingsFormValues => {
  const { social, ...rest } = patch;
  return { ...EMPTY_SETTINGS, ...rest, socialLinks: { ...EMPTY_SETTINGS.socialLinks, ...social } };
};

function errorsOf(values: SettingsFormValues, fallbacks = allFallbacks) {
  const r = parseSettings(values, fallbacks);
  return r.success ? {} : r.errors;
}

test("normalises the WhatsApp number to E.164 with +92 by default", () => {
  const r = parseSettings(form({ whatsappNumber: "0300 1234567", phone: "+44 7700 900123" }), allFallbacks);
  assert.ok(r.success);
  assert.equal(r.data.set.whatsappNumber, "+923001234567");
  assert.equal(r.data.set.phone, "+447700900123");
});

test("rejects a phone number with too few digits", () => {
  assert.equal(errorsOf(form({ phone: "0300123" })).phone, PHONE_ERROR);
  assert.equal(errorsOf(form({ whatsappNumber: "12345" })).whatsappNumber, MESSAGES.whatsappNumber);
});

test("checks email addresses", () => {
  assert.equal(errorsOf(form({ email: "abc" })).email, MESSAGES.email);
  assert.equal(errorsOf(form({ notifyEmail: "a@b" })).notifyEmail, MESSAGES.email);
  const r = parseSettings(form({ email: " hello@example.com " }), allFallbacks);
  assert.ok(r.success);
  assert.equal(r.data.set.email, "hello@example.com");
});

test("accepts https links on the platform's domain and its subdomains", () => {
  const r = parseSettings(
    form({
      social: {
        youtube: "https://m.youtube.com/@x",
        linkedin: "https://www.linkedin.com/in/x",
        instagram: "https://instagram.com/x",
        tiktok: "https://www.tiktok.com/@x",
        x: "https://twitter.com/x",
      },
    }),
    allFallbacks,
  );
  assert.ok(r.success);
  assert.equal(Object.keys(r.data.set.socialLinks ?? {}).length, 5);
  assert.ok(parseSettings(form({ social: { youtube: "https://youtu.be/x", x: "https://x.com/x" } }), allFallbacks).success);
});

test("rejects http, another platform and look-alike hosts", () => {
  const msg = MESSAGES.social("youtube");
  assert.equal(errorsOf(form({ social: { youtube: "http://youtube.com/x" } }))["socialLinks.youtube"], msg);
  assert.equal(errorsOf(form({ social: { youtube: "https://instagram.com/x" } }))["socialLinks.youtube"], msg);
  assert.equal(errorsOf(form({ social: { youtube: "https://youtube.com.evil.com/x" } }))["socialLinks.youtube"], msg);
  assert.equal(errorsOf(form({ social: { youtube: "https://notyoutube.com/x" } }))["socialLinks.youtube"], msg);
  assert.equal(errorsOf(form({ social: { youtube: "youtube.com/x" } }))["socialLinks.youtube"], msg);
});

test("empty optional fields are unset, not stored", () => {
  const r = parseSettings(form(), allFallbacks);
  assert.ok(r.success);
  assert.deepEqual(r.data.set, {});
  assert.ok(r.data.unset.includes("phone"));
  assert.ok(r.data.unset.includes("address"));
  assert.ok(r.data.unset.includes("socialLinks.tiktok"));
  assert.ok(r.data.unset.includes("whatsappNumber"));
});

test("WhatsApp, email and notification email are required only without a fallback", () => {
  const errors = errorsOf(form(), noFallbacks);
  assert.equal(errors.whatsappNumber, MESSAGES.required);
  assert.equal(errors.email, MESSAGES.required);
  assert.equal(errors.notifyEmail, MESSAGES.notifyRequired);
  assert.equal(errors.phone, undefined);
});

test("rejects an address over 300 characters", () => {
  assert.equal(errorsOf(form({ address: "a".repeat(301) })).address, MESSAGES.address);
  assert.ok(parseSettings(form({ address: "a".repeat(300) }), allFallbacks).success);
});

test("survives a malformed payload", () => {
  const r = parseSettings({} as SettingsFormValues, noFallbacks);
  assert.equal(r.success, false);
});
