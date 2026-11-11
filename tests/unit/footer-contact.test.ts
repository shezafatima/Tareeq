import assert from "node:assert/strict";
import { test } from "node:test";
import { readFooterContact } from "../../src/content/data/footer.ts";
import type { EffectiveSettings } from "../../src/lib/settings/merge.ts";

const none: EffectiveSettings = { whatsappNumber: null, email: null, phone: null, address: null, socialLinks: {}, notifyEmail: null };

test("lists every set field in order with the right links", () => {
  const { items } = readFooterContact({
    ...none,
    whatsappNumber: "+923001234567",
    email: "hello@example.com",
    phone: "+924235761234",
    address: "12 Mall Road, Lahore",
  });
  assert.deepEqual(
    items.map((i) => i.kind),
    ["whatsapp", "email", "phone", "address"],
  );
  assert.equal(items[0].value, "+923001234567");
  assert.match(items[0].href ?? "", /^https:\/\/wa\.me\/923001234567\?text=/);
  assert.equal(items[0].external, true);
  assert.equal(items[1].href, "mailto:hello@example.com");
  assert.equal(items[2].href, "tel:+924235761234");
  assert.equal(items[3].href, undefined);
});

test("socials appear in platform order and only when set", () => {
  const { socials } = readFooterContact({
    ...none,
    socialLinks: { x: "https://x.com/t", youtube: "https://youtube.com/@t", tiktok: "https://tiktok.com/@t" },
  });
  assert.deepEqual(
    socials.map((s) => [s.kind, s.label]),
    [
      ["youtube", "YouTube"],
      ["tiktok", "TikTok"],
      ["x", "X"],
    ],
  );
});

test("nothing set gives nothing", () => {
  assert.deepEqual(readFooterContact(none), { items: [], socials: [] });
});
