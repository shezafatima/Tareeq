// Structured data and feed text for blog posts (specs/033-admin-blog FR-024, FR-026). Pure: relative imports only.
import { optimizedUrl, type StoredImage } from "../images/shared.ts";
import { siteUrl } from "../seo.ts";

export const AUTHOR_NAME = "Sheza Fatima";
export const SITE_NAME = "Tareeq";

/** The schema.org Article for a published post. `url` is the post's absolute public address. */
export function articleJsonLd(post: {
  title: string;
  description: string;
  publishedAt: string;
  updatedAt: string;
  cover: StoredImage | null;
  url: string;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title.slice(0, 110),
    description: post.description,
    ...(post.cover ? { image: [optimizedUrl(post.cover.url, 1200)] } : {}),
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: { "@type": "Person", name: AUTHOR_NAME },
    publisher: { "@type": "Organization", name: SITE_NAME, logo: { "@type": "ImageObject", url: siteUrl("/logo.png") } },
    mainEntityOfPage: { "@type": "WebPage", "@id": post.url },
  };
}

/** Escapes text for XML (RSS). */
export function escapeXml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

/** RFC 822 date for RSS, always in GMT. */
export function rfc822(iso: string): string {
  return new Date(iso).toUTCString();
}

export type FeedPost = { slug: string; title: string; excerpt: string; publishedAt: string; category: { name: string } | null };

/** An RSS 2.0 feed of posts (newest first as given). The description is the excerpt, not the full text. */
export function buildRss(posts: FeedPost[], site: { title: string; link: string; description: string; selfLink: string; postUrl: (slug: string) => string; now: Date }): string {
  const items = posts
    .map((p) => {
      const link = escapeXml(site.postUrl(p.slug));
      return [
        "    <item>",
        `      <title>${escapeXml(p.title)}</title>`,
        `      <link>${link}</link>`,
        `      <guid isPermaLink="true">${link}</guid>`,
        `      <description>${escapeXml(p.excerpt)}</description>`,
        `      <pubDate>${rfc822(p.publishedAt)}</pubDate>`,
        ...(p.category ? [`      <category>${escapeXml(p.category.name)}</category>`] : []),
        "    </item>",
      ].join("\n");
    })
    .join("\n");
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${escapeXml(site.title)}</title>`,
    `    <link>${escapeXml(site.link)}</link>`,
    `    <description>${escapeXml(site.description)}</description>`,
    "    <language>en</language>",
    `    <lastBuildDate>${site.now.toUTCString()}</lastBuildDate>`,
    `    <atom:link href="${escapeXml(site.selfLink)}" rel="self" type="application/rss+xml" />`,
    ...(items ? [items] : []),
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}
