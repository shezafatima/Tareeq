import type { Metadata } from "next";
import BlogEmpty from "@/components/sections/blog/BlogEmpty";
import BlogFilterChips from "@/components/sections/blog/BlogFilterChips";
import BlogGrid from "@/components/sections/blog/BlogGrid";
import BlogHero from "@/components/sections/blog/BlogHero";
import BlogPagination from "@/components/sections/blog/BlogPagination";
import PageHeader from "@/components/sections/PageHeader";
import Container from "@/components/ui/Container";
import { loadBlogIndex } from "@/lib/blog/data";
import { blogHref } from "@/lib/blog/view";
import { SLUG_MAX, SLUG_PATTERN } from "@/lib/programs/options";

// The address decides the page (?category=, ?tag=, ?page=); the posts themselves are cached and refreshed by the "blog" tag
// (specs/033-admin-blog).
type Search = Promise<{ category?: string | string[]; tag?: string | string[]; page?: string | string[] }>;

const first = (v: string | string[] | undefined): string => (Array.isArray(v) ? v[0] : v) ?? "";

/** The filters asked for in the address, cleaned. An unknown category or tag is kept as asked: it shows "No posts found". */
function readSearch(raw: Awaited<Search>): { category: string | null; tag: string | null; page: number } {
  const category = first(raw.category).trim().toLowerCase();
  const tag = first(raw.tag).trim().toLowerCase().slice(0, 30);
  const page = Number(first(raw.page));
  return {
    category: category && category.length <= SLUG_MAX && SLUG_PATTERN.test(category) ? category : category ? "-unknown" : null,
    tag: tag || null,
    page: Number.isInteger(page) && page >= 1 ? page : 1,
  };
}

export async function generateMetadata({ searchParams }: { searchParams: Search }): Promise<Metadata> {
  const { category, tag, page } = readSearch(await searchParams);
  const canonical = category || tag ? "/blog" : blogHref({ page });
  return {
    title: "Blog",
    description: "Practical notes on teaching and learning with AI, from the Tareeq team.",
    alternates: { canonical, types: { "application/rss+xml": "/blog/rss.xml" } },
  };
}

export default async function BlogPage({ searchParams }: { searchParams: Search }) {
  const { category, tag, page } = readSearch(await searchParams);
  const index = await loadBlogIndex({ category, tag, page });

  return (
    <>
      <PageHeader intro="Practical notes on teaching and learning with AI.">Blog</PageHeader>
      <Container className="space-y-8 pb-section">
        {index === null ? (
          <p className="rounded-2xl bg-soft px-6 py-10 text-center text-midnight/85">{"We can't load the posts right now. Please try again in a moment."}</p>
        ) : !index.hasPosts ? (
          <BlogEmpty variant="coming-soon" />
        ) : (
          <>
            <BlogFilterChips categories={index.categories} category={category} tag={tag} />
            {index.listing.hero ? <BlogHero post={index.listing.hero} /> : null}
            {index.listing.posts.length > 0 ? (
              <>
                <BlogGrid posts={index.listing.posts} />
                <BlogPagination page={index.listing.page} pages={index.listing.pages} category={category} tag={tag} />
              </>
            ) : index.listing.hero ? null : (
              <BlogEmpty variant="no-results" />
            )}
          </>
        )}
      </Container>
    </>
  );
}
