import assert from "node:assert/strict";
import { test } from "node:test";
import { mergeSiteImages } from "../../src/lib/site-images/merge.ts";

const stored = {
  url: "https://res.cloudinary.com/x/image/upload/v1/tareeq/site/a.jpg",
  publicId: "tareeq/site/a",
  width: 800,
  height: 1000,
  alt: "New photo",
};

test("an empty database gives the default file for every slot", () => {
  for (const merged of [mergeSiteImages(null), mergeSiteImages({})]) {
    assert.equal(merged.founderPhoto.src, "/founder.jpeg");
    assert.equal(merged.founderPhoto.isDefault, true);
    assert.equal(merged.founderPhoto.width, 1122);
  }
});

test("a stored image overrides the default and keeps the default as its fallback", () => {
  const { founderPhoto } = mergeSiteImages({ founderPhoto: stored });
  assert.equal(founderPhoto.src, stored.url);
  assert.equal(founderPhoto.alt, "New photo");
  assert.equal(founderPhoto.isDefault, false);
  assert.equal(founderPhoto.fallbackSrc, "/founder.jpeg");
});

test("an unknown stored key is ignored", () => {
  const merged = mergeSiteImages({ founderPhoto: stored, nope: stored } as never);
  assert.deepEqual(Object.keys(merged), ["founderPhoto"]);
});

test("a stored value with no usable url falls back to the default", () => {
  assert.equal(mergeSiteImages({ founderPhoto: { ...stored, url: "" } }).founderPhoto.isDefault, true);
  assert.equal(mergeSiteImages({ founderPhoto: { ...stored, width: 0 } }).founderPhoto.isDefault, true);
});
