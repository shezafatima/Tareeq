import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogArticle from "@/components/sections/blog/BlogArticle";
import PreviewBanner from "@/components/sections/blog/PreviewBanner";
import { getAdminPost, listAdminBlogCategories } from "@/lib/admin/blog-read";
import { requireAdmin } from "@/lib/admin/session";
import { getRelatedPosts } from "@/lib/blog/data";
import { renderBlogMarkdown } from "@/lib/blog/markdown";
import { readingMinutes, sizesFrom, type PublicPostCard } from "@/lib/blog/view";
import { siteUrl } from "@/lib/seo";
import { getSiteImages } from "@/lib/site-images/data";

// The owner's view of a post, draft or published, exactly as the public page would show it (specs/033-admin-blog FR-017).
// Never cached, never indexed, and the session is checked before anything is read.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false } };

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [post, categories, images] = await Promise.all([getAdminPost(id), listAdminBlogCategories(), getSiteImages()]);
  if (!post) notFound();

  const category = categories.find((c) => c.id === post.categoryId);
  const view = {
    title: post.title,
    category: category ? { name: category.name, slug: category.slug } : null,
    publishedAt: post.publishedAtExact,
    readingTime: readingMinutes(post.content),
    cover: post.coverImage,
    tags: post.tags,
  };
  let related: PublicPostCard[] = [];
  try {
    related = await getRelatedPosts({ slug: post.slug, category: view.category, tags: post.tags }, 3);
  } catch (err) {
    console.error(`[blog] related read failed: ${err instanceof Error ? err.name : "UnknownError"}`);
  }

  return (
    <>
      <PreviewBanner id={post.id} published={post.status === "published"} />
      <BlogArticle
        post={view}
        content={renderBlogMarkdown(post.content, sizesFrom(post.contentImages))}
        authorPhoto={images.founderPhoto}
        url={siteUrl(`/blog/${post.slug}`)}
        related={related}
      />
    </>
  );
}
