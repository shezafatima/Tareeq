import assert from "node:assert/strict";
import { test } from "node:test";
import { imageUrlsIn, renderBlogMarkdown, type RenderedContent } from "../../src/lib/blog/markdown.ts";

const CLOUD = "demo";
const IMG = "https://res.cloudinary.com/demo/image/upload/v1/tareeq/blog/pic.jpg";
const render = (md: string, sizes: Record<string, { width: number; height: number }> = {}): RenderedContent =>
  renderBlogMarkdown(md, sizes, { cloudName: CLOUD });
const html = (c: RenderedContent) => c.segments.map((s) => (s.kind === "html" ? s.html : "")).join("");

test("raw html, scripts and event handlers are never output", () => {
  const out = html(render('<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n<iframe src="https://evil.test"></iframe>\n\n<div onclick="x()">hi</div>\n\nplain'));
  assert.doesNotMatch(out, /<script|<iframe|onerror|onclick|alert\(1\)|evil\.test/i);
  assert.match(out, /plain/);
});

test("inline raw html inside a paragraph is dropped too", () => {
  const out = html(render('Hello <b onmouseover="x()">there</b> <script>bad()</script>world'));
  assert.doesNotMatch(out, /<script|onmouseover|<b/i);
  assert.match(out, /Hello/);
  assert.match(out, /world/);
});

test("unsafe link schemes lose their href; safe ones stay with a safe rel", () => {
  const out = html(render("[a](javascript:alert(1)) [b](data:text/html;base64,AAAA) [c](https://example.com) [d](mailto:a@b.co) [e](//evil.test/x)"));
  assert.doesNotMatch(out, /javascript:|data:text|\/\/evil\.test/);
  assert.match(out, /href="https:\/\/example\.com"/);
  assert.match(out, /href="mailto:a@b\.co"/);
  assert.match(out, /rel="noopener noreferrer"/);
});

test("images from other hosts are dropped; ours under tareeq/ are kept", () => {
  const out = html(render(`text ![ext](https://example.com/a.jpg) and ![ours](${IMG}) done`));
  assert.doesNotMatch(out, /example\.com/);
  assert.match(out, /res\.cloudinary\.com\/demo\/image\/upload\//);
  assert.match(out, /alt="ours"/);
  assert.match(out, /loading="lazy"/);
  // not under tareeq/, or another cloud
  assert.doesNotMatch(html(render("![x](https://res.cloudinary.com/demo/image/upload/v1/other/pic.jpg)")), /<img/);
  assert.doesNotMatch(html(render("![x](https://res.cloudinary.com/someone-else/image/upload/v1/tareeq/blog/pic.jpg)")), /<img/);
});

test("a stand-alone image with a known size becomes an image segment", () => {
  const known = render(`Before\n\n![A picture](${IMG})\n\nAfter`, { [IMG]: { width: 1200, height: 800 } });
  assert.deepEqual(known.segments.map((s) => s.kind), ["html", "image", "html"]);
  const image = known.segments[1];
  assert.equal(image.kind === "image" && image.alt, "A picture");
  assert.equal(image.kind === "image" && image.width, 1200);
  assert.equal(image.kind === "image" && image.height, 800);
  assert.equal(image.kind === "image" && image.src, IMG);
});

test("an image with no known size, or inside text, falls back to a lazy img in html", () => {
  const unknown = render(`![A picture](${IMG})`);
  assert.deepEqual(unknown.segments.map((s) => s.kind), ["html"]);
  assert.match(html(unknown), /<img[^>]+loading="lazy"[^>]+alt="A picture"|<img[^>]+alt="A picture"[^>]+loading="lazy"/);
  const inline = render(`See ![A picture](${IMG}) here`, { [IMG]: { width: 10, height: 10 } });
  assert.deepEqual(inline.segments.map((s) => s.kind), ["html"]);
});

test("a stand-alone image from another host produces no segment at all", () => {
  const out = render("![x](https://example.com/a.jpg)", { "https://example.com/a.jpg": { width: 5, height: 5 } });
  assert.equal(out.segments.some((s) => s.kind === "image"), false);
  assert.doesNotMatch(html(out), /example\.com/);
});

test("headings: h1 becomes h2, ids are unique, only h2/h3 are listed", () => {
  const out = render("# Top\n\n## Same\n\n## Same\n\n### Sub part\n\n#### Deep\n\n## 2024 plans");
  const markup = html(out);
  assert.doesNotMatch(markup, /<h1/);
  assert.match(markup, /<h2 id="top">Top<\/h2>/);
  assert.match(markup, /<h2 id="same">Same<\/h2>/);
  assert.match(markup, /<h2 id="same-2">Same<\/h2>/);
  assert.match(markup, /<h3 id="sub-part">Sub part<\/h3>/);
  assert.match(markup, /<h4 id="deep">Deep<\/h4>/);
  assert.deepEqual(out.headings, [
    { id: "top", text: "Top", level: 2 },
    { id: "same", text: "Same", level: 2 },
    { id: "same-2", text: "Same", level: 2 },
    { id: "sub-part", text: "Sub part", level: 3 },
    { id: "s-2024-plans", text: "2024 plans", level: 2 },
  ]);
});

test("a heading with no usable letters still gets an id", () => {
  const out = render("## ???");
  assert.equal(out.headings.length, 1);
  assert.match(out.headings[0].id, /^s-/);
});

test("tables are wrapped in blog-table and foreign classes are stripped", () => {
  const out = html(render("| a | b |\n|:--|--:|\n| 1 | 2 |"));
  assert.match(out, /<div class="blog-table"[^>]*><table>/);
  assert.match(out, /<th[^>]*>a<\/th>/);
  assert.match(out, /<td[^>]*>2<\/td>/);
  assert.doesNotMatch(html(render('<div class="evil">x</div>\n\n```js\nconst a = 1;\n```')), /class="evil"/);
});

test("code blocks keep only language-* classes", () => {
  const out = html(render("```js\nconst a = '<b>';\n```"));
  assert.match(out, /<pre [^>]*><code class="language-js">/);
  assert.match(out, /&lt;b&gt;/);
});

test("lists, quotes, bold and italic survive", () => {
  const out = html(render("- one\n- two\n\n> quoted\n\n**bold** and *it*"));
  assert.match(out, /<ul>/);
  assert.match(out, /<blockquote>/);
  assert.match(out, /<strong>bold<\/strong>/);
  assert.match(out, /<em>it<\/em>/);
});

test("an empty document renders no segments and no headings", () => {
  const out = render("   \n");
  assert.deepEqual(out.headings, []);
  assert.equal(html(out).trim(), "");
});

test("imageUrlsIn lists each image once, in order, including inside lists and quotes", () => {
  const md = `![a](https://x.test/1.jpg)

- item ![b](https://x.test/2.jpg)

> ![c](https://x.test/3.jpg) ![a again](https://x.test/1.jpg)`;
  assert.deepEqual(imageUrlsIn(md), ["https://x.test/1.jpg", "https://x.test/2.jpg", "https://x.test/3.jpg"]);
  assert.deepEqual(imageUrlsIn(""), []);
});

// specs/033-admin-blog task T077: scrolling boxes are keyboard-reachable regions
test("code blocks and tables are labelled, focusable regions", () => {
  const code = html(render(["```js", "const a = 1;", "```"].join("\n")));
  assert.match(code, /<pre role="region" aria-label="Code" tabindex="0">/);
  const table = html(render(["| a |", "|---|", "| 1 |"].join("\n")));
  assert.match(table, /<div class="blog-table" role="region" aria-label="Table" tabindex="0"><table>/);
  // inline code is not a scrolling box
  assert.doesNotMatch(html(render("use `npm run dev` now")), /tabindex/);
});

test("a stored post cannot add its own tabindex, role or aria attributes", () => {
  const out = html(render(['<div tabindex="5" role="button" aria-label="x" onfocus="y()">hi</div>', "", '[a](https://example.com "t")'].join("\n")));
  assert.doesNotMatch(out, /tabindex|role=|aria-label|onfocus/);
});
