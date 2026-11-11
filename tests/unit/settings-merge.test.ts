import assert from "node:assert/strict";
import { test } from "node:test";
import { mergeSettings, type EffectiveSettings } from "../../src/lib/settings/merge.ts";

const fallback: EffectiveSettings = {
  whatsappNumber: "+923001234567",
  email: "hello@example.com",
  phone: null,
  address: null,
  socialLinks: { youtube: "https://www.youtube.com/@a", linkedin: "https://www.linkedin.com/in/a" },
  notifyEmail: "owner@example.com",
};

test("no saved document gives the fallback", () => {
  assert.deepEqual(mergeSettings(null, fallback), fallback);
});

test("a saved value overrides the fallback", () => {
  const out = mergeSettings({ whatsappNumber: "+447700900123", phone: "+924235761234" }, fallback);
  assert.equal(out.whatsappNumber, "+447700900123");
  assert.equal(out.phone, "+924235761234");
  assert.equal(out.email, "hello@example.com");
});

test("an empty or whitespace saved value falls back", () => {
  const out = mergeSettings({ email: "", notifyEmail: "   " }, fallback);
  assert.equal(out.email, "hello@example.com");
  assert.equal(out.notifyEmail, "owner@example.com");
});

test("no saved value and no fallback is null", () => {
  assert.equal(mergeSettings({}, fallback).address, null);
});

test("once settings are saved, only the saved social links show (a cleared one disappears)", () => {
  const out = mergeSettings({ socialLinks: { youtube: "https://youtu.be/x", instagram: "https://instagram.com/t", tiktok: " " } }, fallback);
  assert.deepEqual(out.socialLinks, { youtube: "https://youtu.be/x", instagram: "https://instagram.com/t" });
  assert.deepEqual(mergeSettings({ email: "a@b.co" }, fallback).socialLinks, {});
});

test("before settings are first saved, the fallback social links show", () => {
  assert.deepEqual(mergeSettings(null, fallback).socialLinks, fallback.socialLinks);
});
