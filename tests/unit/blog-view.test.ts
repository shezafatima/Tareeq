import assert from "node:assert/strict";
import { test } from "node:test";
import {
  blogHref,
  effectiveSeo,
  filterCards,
  listForPage,
  pageWindow,
  paginate,
  pickForHome,
  pickHero,
  rankRelated,
  readingMinutes,
  type PublicPostCard,
} from "../../src/lib/blog/view.ts";

const card = (slug: string, over: Partial<PublicPostCard> = {}): PublicPostCard => ({
  slug,
  title: slug,
  excerpt: `${slug} excerpt`,
  cover: null,
  category: null,
  tags: [],
  publishedAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  readingTime: 1,
  featured: false,
  ...over,
});
const day = (n: number) => new Date(Date.UTC(2026, 0, n)).toISOString();
const cat = (slug: string) => ({ name: slug.toUpperCase(), slug });

test("readingMinutes: minimum 1, 200 words per minute rounded up", () => {
  const words = (n: number) => Array.from({ length: n }, () => "word").join(" ");
  assert.equal(readingMinutes(""), 1);
  assert.equal(readingMinutes(words(200)), 1);
  assert.equal(readingMinutes(words(201)), 2);
  assert.equal(readingMinutes(words(1000)), 5);
});

test("readingMinutes does not count fence markers or image/link addresses", () => {
  const fence = "```";
  assert.equal(readingMinutes(`${"word ".repeat(200)}\n\n${fence}js\n${fence}\n\n![alt](https://res.cloudinary.com/a/b/c.jpg)`), 2); // 200 words + the alt word
  assert.equal(readingMinutes(`${"word ".repeat(199)}[one](https://example.com/very/long/path)`), 1);
});

test("pickHero returns the newest featured card, or null", () => {
  const cards = [
    card("a", { featured: true, publishedAt: day(1) }),
    card("b", { featured: false, publishedAt: day(9) }),
    card("c", { featured: true, publishedAt: day(5) }),
  ];
  assert.equal(pickHero(cards)?.slug, "c");
  assert.equal(pickHero(cards.map((c) => ({ ...c, featured: false }))), null);
  assert.equal(pickHero([]), null);
});

test("filterCards by category slug and by tag, ignoring tag case", () => {
  const cards = [card("a", { category: cat("x"), tags: ["ai"] }), card("b", { category: cat("y"), tags: ["python", "ai"] }), card("c")];
  assert.deepEqual(filterCards(cards, { category: "y" }).map((c) => c.slug), ["b"]);
  assert.deepEqual(filterCards(cards, { tag: "AI" }).map((c) => c.slug), ["a", "b"]);
  assert.deepEqual(filterCards(cards, { category: "x", tag: "python" }), []);
  assert.equal(filterCards(cards, {}).length, 3);
});

test("paginate: 9 per page, bad page numbers, out of range", () => {
  const list = Array.from({ length: 12 }, (_, i) => i);
  assert.deepEqual(paginate(list, 1), { items: list.slice(0, 9), page: 1, pages: 2, total: 12 });
  assert.deepEqual(paginate(list, 2).items, [9, 10, 11]);
  assert.equal(paginate(list, Number.NaN).page, 1);
  assert.equal(paginate(list, 0).page, 1);
  assert.equal(paginate(list, 1.7).page, 1);
  const out = paginate(list, 99);
  assert.deepEqual(out.items, []);
  assert.equal(out.pages, 2);
  assert.deepEqual(paginate([], 1), { items: [], page: 1, pages: 0, total: 0 });
});

test("listForPage: hero only on unfiltered page 1, and never repeated in the grid", () => {
  const cards = [
    ...Array.from({ length: 11 }, (_, i) => card(`p${i}`, { publishedAt: day(20 - i) })),
    card("hero", { featured: true, publishedAt: day(1) }),
  ];
  const p1 = listForPage({ cards, page: 1 });
  assert.equal(p1.hero?.slug, "hero");
  assert.equal(p1.posts.length, 9);
  assert.ok(!p1.posts.some((c) => c.slug === "hero"));
  assert.equal(p1.total, 11);
  assert.equal(p1.pages, 2);
  const p2 = listForPage({ cards, page: 2 });
  assert.equal(p2.hero, null);
  assert.equal(p2.posts.length, 2);
  assert.ok(!p2.posts.some((c) => c.slug === "hero"));
});

test("listForPage: a filter hides the hero and keeps the featured post in the list", () => {
  const cards = [card("hero", { featured: true, category: cat("x") }), card("b", { category: cat("x") })];
  const r = listForPage({ cards, category: "x", page: 1 });
  assert.equal(r.hero, null);
  assert.equal(r.posts.length, 2);
  assert.equal(r.unknown, false);
});

test("listForPage: unknown is true only when a filter was given and matched nothing", () => {
  const cards = [card("a", { category: cat("x"), tags: ["ai"] })];
  assert.equal(listForPage({ cards, category: "nope", page: 1 }).unknown, true);
  assert.equal(listForPage({ cards, tag: "nope", page: 1 }).unknown, true);
  assert.equal(listForPage({ cards, page: 1 }).unknown, false);
  assert.equal(listForPage({ cards: [], page: 1 }).unknown, false);
});

test("rankRelated: same category first, then shared tags, then newest; never the post itself", () => {
  const me = card("me", { category: cat("x"), tags: ["ai", "py"], publishedAt: day(10) });
  const cards = [
    me,
    card("x-old", { category: cat("x"), publishedAt: day(2) }),
    card("x-new", { category: cat("x"), publishedAt: day(8) }),
    card("y-two", { category: cat("y"), tags: ["ai", "py"], publishedAt: day(1) }),
    card("y-one", { category: cat("y"), tags: ["ai"], publishedAt: day(9) }),
    card("z", { category: cat("z"), publishedAt: day(20) }),
  ];
  assert.deepEqual(rankRelated(me, cards, 3).map((c) => c.slug), ["x-new", "x-old", "y-two"]);
  assert.deepEqual(rankRelated(me, cards, 5).map((c) => c.slug), ["x-new", "x-old", "y-two", "y-one", "z"]);
  assert.deepEqual(rankRelated(me, [me], 3), []);
});

test("effectiveSeo falls back to the title and the excerpt", () => {
  assert.deepEqual(effectiveSeo({ title: "T", excerpt: "E", seo: { metaTitle: "", metaDescription: "" } }), { title: "T", description: "E" });
  assert.deepEqual(effectiveSeo({ title: "T", excerpt: "E", seo: { metaTitle: " M ", metaDescription: " D " } }), { title: "M", description: "D" });
  assert.deepEqual(effectiveSeo({ title: "T", excerpt: "E", seo: { metaTitle: "M", metaDescription: "" } }), { title: "M", description: "E" });
});

test("blogHref keeps filters and drops page 1", () => {
  assert.equal(blogHref({}), "/blog");
  assert.equal(blogHref({ category: "ai-basics" }), "/blog?category=ai-basics");
  assert.equal(blogHref({ tag: "python", page: 2 }), "/blog?tag=python&page=2");
  assert.equal(blogHref({ category: "a", tag: "b", page: 1 }), "/blog?category=a&tag=b");
  assert.equal(blogHref({ tag: "a b&c" }), "/blog?tag=a+b%26c");
});

test("pageWindow shows the ends and the neighbours, with gaps", () => {
  assert.deepEqual(pageWindow(1, 1), [1]);
  assert.deepEqual(pageWindow(1, 3), [1, 2, 3]);
  assert.deepEqual(pageWindow(1, 10), [1, 2, null, 10]);
  assert.deepEqual(pageWindow(5, 10), [1, null, 4, 5, 6, null, 10]);
  assert.deepEqual(pageWindow(10, 10), [1, null, 9, 10]);
  assert.deepEqual(pageWindow(2, 4), [1, 2, 3, 4]);
  assert.deepEqual(pageWindow(1, 0), []);
});

test("pickForHome: featured first, then the rest, each newest first, at most n", () => {
  const cards = [
    card("old", { publishedAt: day(1) }),
    card("new", { publishedAt: day(9) }),
    card("feat-old", { featured: true, publishedAt: day(2) }),
    card("feat-new", { featured: true, publishedAt: day(5) }),
    card("mid", { publishedAt: day(6) }),
  ];
  assert.deepEqual(pickForHome(cards, 3).map((c) => c.slug), ["feat-new", "feat-old", "new"]);
  assert.deepEqual(pickForHome(cards, 10).map((c) => c.slug), ["feat-new", "feat-old", "new", "mid", "old"]);
  assert.deepEqual(pickForHome(cards, 0), []);
  assert.deepEqual(pickForHome([], 3), []);
  assert.equal(cards[0].slug, "old"); // the input is not reordered
});
