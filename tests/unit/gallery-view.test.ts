import assert from "node:assert/strict";
import { test } from "node:test";
import { clampLimit, compareAlbums, comparePhotos, hasAlt, isPhotoVisible, resolveCover } from "../../src/lib/gallery/view.ts";

const photo = (alt: string, published = true) => ({ published, image: { alt } });

test("a photo is visible only when published, described and its album is published", () => {
  assert.equal(isPhotoVisible(photo("Teachers at work"), true), true);
  assert.equal(isPhotoVisible(photo("Teachers at work", false), true), false);
  assert.equal(isPhotoVisible(photo("Teachers at work"), false), false);
});

test("blank or whitespace alt text is not visible", () => {
  assert.equal(isPhotoVisible(photo(""), true), false);
  assert.equal(isPhotoVisible(photo("   "), true), false);
  assert.equal(hasAlt(undefined), false);
  assert.equal(hasAlt(" a "), true);
});

test("photos sort by order, oldest first on ties", () => {
  const rows = [
    { id: "c", order: 2, createdAt: "2026-01-01" },
    { id: "b", order: 1, createdAt: "2026-01-03" },
    { id: "a", order: 1, createdAt: "2026-01-02" },
  ];
  assert.deepEqual([...rows].sort(comparePhotos).map((r) => r.id), ["a", "b", "c"]);
});

test("albums sort newest created first, the order number breaks ties", () => {
  const rows = [
    { id: "old", order: 0, createdAt: "2026-01-01" },
    { id: "new-b", order: 2, createdAt: "2026-03-01" },
    { id: "new-a", order: 1, createdAt: "2026-03-01" },
  ];
  assert.deepEqual([...rows].sort(compareAlbums).map((r) => r.id), ["new-a", "new-b", "old"]);
});

test("resolveCover uses the chosen photo, else the first, else null", () => {
  const photos = [{ id: "1" }, { id: "2" }, { id: "3" }];
  assert.equal(resolveCover("2", photos)?.id, "2");
  assert.equal(resolveCover("missing", photos)?.id, "1");
  assert.equal(resolveCover(null, photos)?.id, "1");
  assert.equal(resolveCover("2", []), null);
});

test("clampLimit keeps a limit between 1 and 24", () => {
  assert.equal(clampLimit(0), 1);
  assert.equal(clampLimit(100), 24);
  assert.equal(clampLimit(6), 6);
  assert.equal(clampLimit(NaN), 1);
});
