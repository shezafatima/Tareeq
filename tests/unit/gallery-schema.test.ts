import assert from "node:assert/strict";
import { test } from "node:test";
import { parseAlbum, parsePhotoDetails, slugify } from "../../src/lib/admin/gallery-schema.ts";

const album = { title: "Teacher workshop, Karachi", dateText: "November 2026", description: "", order: "0", published: false };

test("a valid album parses and a blank description is left out", () => {
  const r = parseAlbum(album);
  assert.equal(r.success, true);
  if (r.success) {
    assert.equal("description" in r.data, false);
    assert.equal(r.data.order, 0);
  }
});

test("title and date label are required and capped", () => {
  assert.equal(parseAlbum({ ...album, title: "  " }).success, false);
  assert.equal(parseAlbum({ ...album, title: "x".repeat(121) }).success, false);
  assert.equal(parseAlbum({ ...album, dateText: "" }).success, false);
  assert.equal(parseAlbum({ ...album, dateText: "x".repeat(41) }).success, false);
});

test("description is capped at 500", () => {
  assert.equal(parseAlbum({ ...album, description: "x".repeat(501) }).success, false);
  assert.equal(parseAlbum({ ...album, description: "x".repeat(500) }).success, true);
});

test("order must be a whole number from 0 to 9999", () => {
  for (const bad of ["abc", "-1", "10000", "1.5", ""]) assert.equal(parseAlbum({ ...album, order: bad }).success, false, bad);
  for (const good of ["0", "9999", " 7 "]) assert.equal(parseAlbum({ ...album, order: good }).success, true, good);
});

test("photo alt may be blank but not over 200; the caption is capped at 300", () => {
  assert.equal(parsePhotoDetails({ alt: "", caption: "", order: "1" }).success, true);
  assert.equal(parsePhotoDetails({ alt: "   ", caption: "", order: "1" }).success, true);
  assert.equal(parsePhotoDetails({ alt: "x".repeat(201), caption: "", order: "1" }).success, false);
  assert.equal(parsePhotoDetails({ alt: "ok", caption: "x".repeat(301), order: "1" }).success, false);
  const r = parsePhotoDetails({ alt: "  Teachers  ", caption: " ", order: "3" });
  assert.equal(r.success && r.data.alt, "Teachers");
  assert.equal(r.success && "caption" in r.data, false);
});

test("slugify makes an address from the title", () => {
  assert.equal(slugify("Teacher workshop, Karachi"), "teacher-workshop-karachi");
});
