import assert from "node:assert/strict";
import { test } from "node:test";
import { whatsappLink } from "../../src/lib/admin/whatsapp.ts";

test("keeps digits only and drops the plus sign", () => {
  const url = whatsappLink("+92 300 1234567", "Ayesha Khan");
  assert.ok(url?.startsWith("https://wa.me/923001234567?text="));
  assert.ok(!url?.includes("+"));
});

test("the greeting uses the first name and is URL encoded", () => {
  const url = whatsappLink("+923001234567", "Ayesha Khan") ?? "";
  const text = decodeURIComponent(url.split("?text=")[1]);
  assert.match(text, /^Assalam o Alaikum Ayesha,/);
  assert.ok(!text.includes("Khan"));
});

test("a missing name still gives a greeting", () => {
  const text = decodeURIComponent((whatsappLink("+923001234567", "  ") ?? "").split("?text=")[1]);
  assert.match(text, /^Assalam o Alaikum, this is Tareeq/);
});

test("too few or too many digits gives no link", () => {
  assert.equal(whatsappLink("123", "A"), null);
  assert.equal(whatsappLink("", "A"), null);
  assert.equal(whatsappLink("1".repeat(16), "A"), null);
});
