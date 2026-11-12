import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogArticle from "@/components/sections/blog/BlogArticle";
import { getPostBySlug, getPublishedPostSlugs, getRelatedPosts } from "@/lib/blog/data";
import { renderBlogMarkdown } from "@/lib/blog/markdown";
import { articleJsonLd, AUTHOR_NAME, SITE_NAME } from "@/lib/blog/seo";
import { effectiveSeo, sizesFrom, type PublicPostCard } from "@/lib/blog/view";
import { optimizedUrl } from "@/lib/images/shared";
import { jsonLd, siteUrl } from "@/lib/seo";
import { getSiteImages } from "@/lib/site-images/data";

// Static, refreshed hourly and by the "blog" and "post:<slug>" tags (specs/033-admin-blog). A post published after the build is
// rendered on its first visit; a draft or unknown address answers 404.
export const revalidate = 3600;
export const dynamicParams = true;

type PostPageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getPublishedPostSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};

  const { title, description } = effectiveSeo(post);
  const path = `/blog/${post.slug}`;
  const image = post.cover
    ? { url: optimizedUrl(post.cover.url, 1200), width: post.cover.width, height: post.cover.height, alt: post.cover.alt }
    : null;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      type: "article",
      siteName: SITE_NAME,
      url: path,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [AUTHOR_NAME],
      ...(image ? { images: [image] } : {}),
    },
    twitter: { card: "summary_large_image", title, description, ...(image ? { images: [image.url] } : {}) },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const url = siteUrl(`/blog/${post.slug}`);
  const content = renderBlogMarkdown(post.content, sizesFrom(post.contentImages));
  const images = await getSiteImages();
  // related posts are a nicety: if they cannot be read, the post is still shown
  let related: PublicPostCard[] = [];
  try {
    related = await getRelatedPosts(post, 3);
  } catch (err) {
    console.error(`[blog] related read failed: ${err instanceof Error ? err.name : "UnknownError"}`);
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(
            articleJsonLd({
              title: post.title,
              description: effectiveSeo(post).description,
              publishedAt: post.publishedAt,
              updatedAt: post.updatedAt,
              cover: post.cover,
              url,
            }),
          ),
        }}
      />
      <BlogArticle post={post} content={content} authorPhoto={images.founderPhoto} url={url} related={related} />
    </>
  );
}
