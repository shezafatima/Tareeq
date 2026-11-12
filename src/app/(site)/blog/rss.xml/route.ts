import { getFeedPosts } from "@/lib/blog/data";
import { buildRss } from "@/lib/blog/seo";
import { siteUrl } from "@/lib/seo";

// The blog's RSS 2.0 feed (specs/033-admin-blog FR-026): the newest 20 published posts, excerpts only. Public and read-only: it
// answers GET and nothing else, and imports nothing from the admin code (scripts/admin-guard-test.mts checks both).
export const revalidate = 3600;

export async function GET() {
  try {
    const posts = await getFeedPosts(20);
    const xml = buildRss(
      posts.map((p) => ({ slug: p.slug, title: p.title, excerpt: p.excerpt, publishedAt: p.publishedAt, category: p.category })),
      {
        title: "Tareeq Blog",
        link: siteUrl("/blog"),
        description: "Practical notes on teaching and learning with AI, from the Tareeq team.",
        selfLink: siteUrl("/blog/rss.xml"),
        postUrl: (slug) => siteUrl(`/blog/${slug}`),
        now: new Date(),
      },
    );
    return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
  } catch (err) {
    console.error(`[blog] feed failed: ${err instanceof Error ? err.name : "UnknownError"}`);
    return new Response("The feed is unavailable right now.", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}
