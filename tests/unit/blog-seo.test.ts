import assert from "node:assert/strict";
import { test } from "node:test";
import { jsonLd, siteUrl } from "../../src/lib/seo.ts";
import { articleJsonLd, buildRss, escapeXml, rfc822 } from "../../src/lib/blog/seo.ts";

const COVER = { url: "https://res.cloudinary.com/demo/image/upload/v1/tareeq/blog/a.jpg", publicId: "tareeq/blog/a", width: 1200, height: 630, alt: "Cover" };

test("siteUrl joins the base and a path without doubled slashes", () => {
  const saved = process.env.NEXT_PUBLIC_SITE_URL;
  process.env.NEXT_PUBLIC_SITE_URL = "https://tareeq.example/";
  try {
    assert.equal(siteUrl("/blog"), "https://tareeq.example/blog");
    assert.equal(siteUrl("blog/x"), "https://tareeq.example/blog/x");
    assert.equal(siteUrl(), "https://tareeq.example/");
  } finally {
    if (saved === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = saved;
  }
});

test("jsonLd can never close its script tag", () => {
  const out = jsonLd({ headline: "</script><script>alert(1)</script>" });
  assert.doesNotMatch(out, /<\/script/i);
  assert.equal(JSON.parse(out).headline, "</script><script>alert(1)</script>");
});

test("articleJsonLd carries the fields search engines need", () => {
  const ld = articleJsonLd({
    title: "Teaching Kids to Code",
    description: "A short summary.",
    publishedAt: "2026-11-12T04:00:00.000Z",
    updatedAt: "2026-11-13T04:00:00.000Z",
    cover: COVER,
    url: "https://tareeq.example/blog/teaching-kids-to-code",
  });
  assert.equal(ld["@type"], "Article");
  assert.equal(ld.headline, "Teaching Kids to Code");
  assert.equal(ld.datePublished, "2026-11-12T04:00:00.000Z");
  assert.equal(ld.dateModified, "2026-11-13T04:00:00.000Z");
  assert.deepEqual(ld.author, { "@type": "Person", name: "Sheza Fatima" });
  assert.equal((ld.publisher as { name: string }).name, "Tareeq");
  assert.match((ld.image as string[])[0], /f_auto/);
  assert.deepEqual(ld.mainEntityOfPage, { "@type": "WebPage", "@id": "https://tareeq.example/blog/teaching-kids-to-code" });
  assert.equal("image" in articleJsonLd({ title: "t", description: "", publishedAt: "", updatedAt: "", cover: null, url: "u" }), false);
});

test("a headline is cut to 110 characters", () => {
  const ld = articleJsonLd({ title: "x".repeat(200), description: "", publishedAt: "", updatedAt: "", cover: null, url: "u" });
  assert.equal((ld.headline as string).length, 110);
});

test("escapeXml escapes the five XML characters", () => {
  assert.equal(escapeXml(`a & b < c > d " e ' f`), "a &amp; b &lt; c &gt; d &quot; e &apos; f");
});

test("rfc822 gives a GMT date", () => {
  assert.equal(rfc822("2026-11-12T04:00:00.000Z"), "Thu, 12 Nov 2026 04:00:00 GMT");
});

test("buildRss makes an RSS 2.0 feed with escaped text and one item per post", () => {
  const xml = buildRss(
    [
      { slug: "a", title: "A & B", excerpt: "Tom's <b>tips</b>", publishedAt: "2026-11-12T04:00:00.000Z", category: { name: "Tips" } },
      { slug: "b", title: "Second", excerpt: "", publishedAt: "2026-11-01T04:00:00.000Z", category: null },
    ],
    {
      title: "Tareeq Blog",
      link: "https://t.example/blog",
      description: "Notes",
      selfLink: "https://t.example/blog/rss.xml",
      postUrl: (slug) => `https://t.example/blog/${slug}`,
      now: new Date("2026-11-13T00:00:00.000Z"),
    },
  );
  assert.match(xml, /^<\?xml version="1.0" encoding="UTF-8"\?>/);
  assert.match(xml, /<rss version="2.0"/);
  assert.equal((xml.match(/<item>/g) ?? []).length, 2);
  assert.match(xml, /<title>A &amp; B<\/title>/);
  assert.match(xml, /<description>Tom&apos;s &lt;b&gt;tips&lt;\/b&gt;<\/description>/);
  assert.match(xml, /<guid isPermaLink="true">https:\/\/t\.example\/blog\/a<\/guid>/);
  assert.match(xml, /<category>Tips<\/category>/);
  assert.equal((xml.match(/<category>/g) ?? []).length, 1);
  assert.match(xml, /<pubDate>Thu, 12 Nov 2026 04:00:00 GMT<\/pubDate>/);
  assert.match(xml, /<lastBuildDate>Fri, 13 Nov 2026 00:00:00 GMT<\/lastBuildDate>/);
});
