import assert from "node:assert/strict";
import { test } from "node:test";
import { whatsappLink, type WhatsAppTopic } from "../../src/lib/admin/whatsapp.ts";

const WS: WhatsAppTopic = { type: "workshop", organization: "Beacon School" };
const CO: WhatsAppTopic = { type: "course", courseName: "Prompting basics" };
const textOf = (url: string | null) => decodeURIComponent((url ?? "").split("?text=")[1] ?? "");

test("keeps digits only and drops the plus sign", () => {
  const url = whatsappLink("+92 300 1234567", "Ayesha Khan", WS);
  assert.ok(url?.startsWith("https://wa.me/923001234567?text="));
  assert.ok(!url?.includes("+"));
});

test("the greeting uses the first name and is URL encoded", () => {
  const url = whatsappLink("+923001234567", "Ayesha Khan", WS) ?? "";
  const text = textOf(url);
  assert.match(text, /^Assalam o Alaikum Ayesha,/);
  assert.ok(!text.includes("Khan"));
  assert.ok(!url.split("?text=")[1].includes(" "));
});

test("a workshop message names the organization", () => {
  assert.match(textOf(whatsappLink("+923001234567", "Ayesha", WS)), /workshop request for Beacon School\./);
});

test("a course message names the course", () => {
  assert.match(textOf(whatsappLink("+923001234567", "Ayesha", CO)), /registering for Prompting basics\./);
});

test("a missing name still gives a greeting", () => {
  assert.match(textOf(whatsappLink("+923001234567", "  ", CO)), /^Assalam o Alaikum, this is Tareeq/);
});

test("too few or too many digits gives no link", () => {
  assert.equal(whatsappLink("123", "A", WS), null);
  assert.equal(whatsappLink("", "A", CO), null);
  assert.equal(whatsappLink("1".repeat(16), "A", WS), null);
});
