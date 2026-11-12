import assert from "node:assert/strict";
import { test } from "node:test";
import { IMAGE_LIMITS, imageSchema, optimizedUrl, validateFile } from "../../src/lib/images/shared.ts";

const MB = 1024 * 1024;

test("validateFile accepts jpg, png and webp up to 5 MB", () => {
  assert.equal(validateFile({ name: "a.jpg", type: "image/jpeg", size: 5 * MB }), null);
  assert.equal(validateFile({ name: "a.JPEG", type: "image/jpeg", size: 10 }), null);
  assert.equal(validateFile({ name: "a.png", type: "image/png", size: 10 }), null);
  assert.equal(validateFile({ name: "a.webp", type: "image/webp", size: 10 }), null);
});

test("validateFile rejects other types, big, empty and mismatched files", () => {
  assert.ok(validateFile({ name: "a.gif", type: "image/gif", size: 10 }));
  assert.ok(validateFile({ name: "a.svg", type: "image/svg+xml", size: 10 }));
  assert.ok(validateFile({ name: "a.jpg", type: "image/jpeg", size: 5 * MB + 1 }));
  assert.ok(validateFile({ name: "a.jpg", type: "image/jpeg", size: 0 }));
  assert.ok(validateFile({ name: "a.png", type: "image/jpeg", size: 10 }));
  assert.ok(validateFile({ name: "noext", type: "image/png", size: 10 }));
  assert.equal(IMAGE_LIMITS.maxBytes, 5 * MB);
});

const good = {
  url: "https://res.cloudinary.com/x/image/upload/v1/tareeq/site/a.jpg",
  publicId: "tareeq/site/a",
  width: 10,
  height: 20,
  alt: "A photo",
};

test("imageSchema requires alt text", () => {
  assert.equal(imageSchema.safeParse(good).success, true);
  assert.equal(imageSchema.safeParse({ ...good, alt: "" }).success, false);
  assert.equal(imageSchema.safeParse({ ...good, alt: "   " }).success, false);
  assert.equal(imageSchema.safeParse({ ...good, alt: "x".repeat(201) }).success, false);
  assert.equal(imageSchema.safeParse({ ...good, width: 0 }).success, false);
});

test("optimizedUrl adds the transform once and leaves other URLs alone", () => {
  const once = optimizedUrl(good.url, 640);
  assert.equal(once, "https://res.cloudinary.com/x/image/upload/f_auto,q_auto,w_640/v1/tareeq/site/a.jpg");
  assert.equal(optimizedUrl(once, 640), once);
  assert.equal(optimizedUrl(good.url), "https://res.cloudinary.com/x/image/upload/f_auto,q_auto/v1/tareeq/site/a.jpg");
  assert.equal(optimizedUrl("/founder.jpeg"), "/founder.jpeg");
  assert.equal(optimizedUrl("https://example.com/a.jpg"), "https://example.com/a.jpg");
});

// specs/033-admin-blog research R4
import { publicIdFromUrl } from "../../src/lib/images/shared.ts";

test("publicIdFromUrl reads the id from our delivery URLs and rejects the rest", () => {
  const base = "https://res.cloudinary.com/demo/image/upload";
  assert.equal(publicIdFromUrl(`${base}/v123/tareeq/blog/a.jpg`), "tareeq/blog/a");
  assert.equal(publicIdFromUrl(`${base}/f_auto,q_auto,w_800/v123/tareeq/blog/a.jpg`), "tareeq/blog/a");
  assert.equal(publicIdFromUrl(`${base}/tareeq/blog/a.png?x=1`), "tareeq/blog/a");
  assert.equal(publicIdFromUrl(`${base}/v123/other/a.jpg`), null);
  assert.equal(publicIdFromUrl("https://example.com/image/upload/v1/tareeq/a.jpg"), null);
  assert.equal(publicIdFromUrl(`${base}/v123/tareeq/blog/a.jpg`, "other"), null);
});
