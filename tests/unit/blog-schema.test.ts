import assert from "node:assert/strict";
import { test } from "node:test";
import { EMPTY_POST, LIMITS, normaliseTags, parseBlogPost, publishIssues, type BlogPostFormValues } from "../../src/lib/admin/blog-schema.ts";

const COVER = { url: "https://res.cloudinary.com/demo/image/upload/v1/tareeq/blog/a.jpg", publicId: "tareeq/blog/a", width: 1200, height: 800, alt: "Kids coding" };
const CATEGORY = "a".repeat(24);
const complete = (over: Partial<BlogPostFormValues> = {}): BlogPostFormValues => ({
  ...EMPTY_POST,
  title: "Teaching Kids to Code",
  slug: "teaching-kids-to-code",
  excerpt: "A short summary.",
  categoryId: CATEGORY,
  coverImage: COVER,
  content: "Hello world",
  ...over,
});

test("a draft needs only a title", () => {
  assert.equal(parseBlogPost({ ...EMPTY_POST, title: "Hi", slug: "hi" }).success, true);
  const r = parseBlogPost({ ...EMPTY_POST });
  assert.equal(r.success, false);
  if (!r.success) assert.ok(r.errors.title);
});

test("limits: title 120, excerpt 200, content 100000, meta 70/200", () => {
  const bad = (over: Partial<BlogPostFormValues>, key: string) => {
    const r = parseBlogPost(complete(over));
    assert.equal(r.success, false, key);
    if (!r.success) assert.ok(r.errors[key], key);
  };
  bad({ title: "x".repeat(LIMITS.title + 1) }, "title");
  bad({ excerpt: "x".repeat(LIMITS.excerpt + 1) }, "excerpt");
  bad({ content: "x".repeat(LIMITS.content + 1) }, "content");
  bad({ metaTitle: "x".repeat(LIMITS.metaTitle + 1) }, "metaTitle");
  bad({ metaDescription: "x".repeat(LIMITS.metaDescription + 1) }, "metaDescription");
  assert.equal(parseBlogPost(complete({ excerpt: "x".repeat(200) })).success, true);
});

test("slug: pattern, length and the reserved word preview", () => {
  for (const slug of ["Has Caps", "a--b", "-a", "a-", "", "x".repeat(81), "preview"]) {
    const r = parseBlogPost(complete({ slug }));
    assert.equal(r.success, false, slug);
    if (!r.success) assert.ok(r.errors.slug, slug);
  }
  assert.equal(parseBlogPost(complete({ slug: "previews" })).success, true);
});

test("tags are trimmed, lower-cased, de-duplicated and limited", () => {
  assert.deepEqual(normaliseTags(["AI", "ai ", " Python", "", "  "]), ["ai", "python"]);
  const parsed = parseBlogPost(complete({ tags: ["AI", "ai ", " Python"] }));
  assert.equal(parsed.success && parsed.data.tags.join(","), "ai,python");
  assert.equal(parseBlogPost(complete({ tags: Array.from({ length: 11 }, (_, i) => `t${i}`) })).success, false);
  assert.equal(parseBlogPost(complete({ tags: ["x".repeat(31)] })).success, false);
  assert.equal(parseBlogPost(complete({ tags: Array.from({ length: 10 }, (_, i) => `t${i}`) })).success, true);
});

test("publishedAt is a day or empty, and not more than a year ahead", () => {
  assert.equal(parseBlogPost(complete({ publishedAt: "" })).success, true);
  assert.equal(parseBlogPost(complete({ publishedAt: "2026-11-12" })).success, true);
  assert.equal(parseBlogPost(complete({ publishedAt: "12/11/2026" })).success, false);
  assert.equal(parseBlogPost(complete({ publishedAt: "2026-02-31" })).success, false);
  const far = new Date(Date.now() + 400 * 86400000).toISOString().slice(0, 10);
  assert.equal(parseBlogPost(complete({ publishedAt: far })).success, false);
});

test("the category must be an id or empty; status must be draft or published", () => {
  assert.equal(parseBlogPost(complete({ categoryId: "" })).success, true);
  assert.equal(parseBlogPost(complete({ categoryId: "nope" })).success, false);
  assert.equal(parseBlogPost(complete({ status: "archived" as never })).success, false);
});

test("a draft may have a cover without alt text, but alt text still has a length limit", () => {
  assert.equal(parseBlogPost(complete({ coverImage: { ...COVER, alt: "" } })).success, true);
  assert.equal(parseBlogPost(complete({ coverImage: { ...COVER, alt: "x".repeat(201) } })).success, false);
});

test("publishIssues reports each missing field and nothing when complete", () => {
  assert.deepEqual(publishIssues(complete()), {});
  const issues = publishIssues({ ...EMPTY_POST });
  for (const key of ["title", "slug", "excerpt", "categoryId", "coverImage", "content"]) assert.ok(issues[key], key);
  assert.ok(publishIssues(complete({ coverImage: { ...COVER, alt: "  " } })).coverImage);
  assert.ok(publishIssues(complete({ content: "   \n " })).content);
  assert.ok(publishIssues(complete({ excerpt: "  " })).excerpt);
});
