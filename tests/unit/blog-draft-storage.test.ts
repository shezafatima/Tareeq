import assert from "node:assert/strict";
import { test } from "node:test";
import { EMPTY_POST, type BlogPostFormValues } from "../../src/lib/admin/blog-schema.ts";
import { clearDraft, draftKey, moveDraft, readDraft, shouldOffer, writeDraft, type StorageLike } from "../../src/lib/blog/draft-storage.ts";

const memory = (): StorageLike & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
};
const throwing: StorageLike = {
  getItem: () => {
    throw new Error("blocked");
  },
  setItem: () => {
    throw new Error("full");
  },
  removeItem: () => {
    throw new Error("blocked");
  },
};
const values = (over: Partial<BlogPostFormValues> = {}): BlogPostFormValues => ({ ...EMPTY_POST, title: "Hello", content: "Body", ...over });
const NOW = new Date("2026-11-12T10:00:00.000Z");

test("the key is per post, and 'new' before the first save", () => {
  assert.equal(draftKey("abc"), "tareeq:blog-draft:abc");
  assert.equal(draftKey(null), "tareeq:blog-draft:new");
});

test("a copy round-trips with the time it was taken", () => {
  const s = memory();
  assert.equal(writeDraft(s, "abc", values({ title: "Mine" }), NOW), true);
  const draft = readDraft(s, "abc");
  assert.equal(draft?.v, 1);
  assert.equal(draft?.savedAt, NOW.toISOString());
  assert.equal(draft?.values.title, "Mine");
  assert.equal(readDraft(s, "other"), null);
});

test("a copy with the wrong version or shape is ignored and removed", () => {
  const s = memory();
  s.setItem(draftKey("a"), JSON.stringify({ v: 2, savedAt: NOW.toISOString(), values: values() }));
  assert.equal(readDraft(s, "a"), null);
  assert.equal(s.data.has(draftKey("a")), false);
  s.setItem(draftKey("b"), "{not json");
  assert.equal(readDraft(s, "b"), null);
  s.setItem(draftKey("c"), JSON.stringify({ v: 1, savedAt: NOW.toISOString(), values: { title: 5 } }));
  assert.equal(readDraft(s, "c"), null);
  assert.equal(s.data.has(draftKey("c")), false);
  s.setItem(draftKey("d"), JSON.stringify({ v: 1, savedAt: "not a date", values: values() }));
  assert.equal(readDraft(s, "d"), null);
});

test("clearDraft removes the copy", () => {
  const s = memory();
  writeDraft(s, "a", values(), NOW);
  clearDraft(s, "a");
  assert.equal(readDraft(s, "a"), null);
});

test("moveDraft carries a 'new' copy to the saved post's key", () => {
  const s = memory();
  writeDraft(s, null, values({ title: "First" }), NOW);
  moveDraft(s, null, "abc");
  assert.equal(readDraft(s, null), null);
  assert.equal(readDraft(s, "abc")?.values.title, "First");
});

test("shouldOffer: only when the copy differs and is newer than the saved post", () => {
  const server = values({ title: "Saved" });
  const copy = (over: Partial<BlogPostFormValues>, savedAt = "2026-11-12T10:00:00.000Z") => ({ v: 1 as const, savedAt, values: values(over) });
  assert.equal(shouldOffer(copy({ title: "Edited" }), server, "2026-11-12T09:00:00.000Z"), true);
  assert.equal(shouldOffer(copy({ title: "Saved" }), server, "2026-11-12T09:00:00.000Z"), false); // same text
  assert.equal(shouldOffer(copy({ title: "Edited" }), server, "2026-11-12T11:00:00.000Z"), false); // saved after the copy
  assert.equal(shouldOffer(copy({ title: "Edited" }), server, null), true); // a new post has no saved time
  assert.equal(shouldOffer(copy({ tags: ["ai"] }), server, null), true);
  // status and the slug-follows-title flag are not content
  assert.equal(shouldOffer(copy({ title: "Saved", status: "published", slugAuto: false }), server, null), false);
});

test("storage that throws never throws out of any function", () => {
  assert.equal(writeDraft(throwing, "a", values(), NOW), false);
  assert.equal(readDraft(throwing, "a"), null);
  assert.doesNotThrow(() => clearDraft(throwing, "a"));
  assert.doesNotThrow(() => moveDraft(throwing, null, "a"));
});

test("no storage at all is fine", () => {
  assert.equal(writeDraft(null, "a", values(), NOW), false);
  assert.equal(readDraft(null, "a"), null);
  assert.doesNotThrow(() => clearDraft(null, "a"));
  assert.doesNotThrow(() => moveDraft(null, null, "a"));
});
