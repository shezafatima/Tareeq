import type { MetadataRoute } from "next";
import { getSitemapPosts, hasPublishedPostsSafe } from "@/lib/blog/data";
import { getPublishedCourseSlugs } from "@/lib/courses/data";
import { getPublishedAlbumSlugs, hasPublicGallerySafe } from "@/lib/gallery/data";
import { getPublishedSlugs } from "@/lib/programs/data";
import { siteUrl } from "@/lib/seo";

// The site's sitemap (specs/033-admin-blog FR-025): the public pages, the published program, course and album pages, and every
// published blog post. Refreshed hourly; drafts and unpublished items never appear. Every reader below returns an empty list
// when the database cannot be read, so the build still succeeds.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [programs, courses, albums, posts, hasGallery, hasBlog] = await Promise.all([
    getPublishedSlugs(),
    getPublishedCourseSlugs(),
    getPublishedAlbumSlugs(),
    getSitemapPosts(),
    hasPublicGallerySafe(),
    hasPublishedPostsSafe(),
  ]);

  const pages = ["/programs", "/courses", "/workshop", "/our-way", "/register", ...(hasGallery ? ["/gallery"] : []), ...(hasBlog ? ["/blog"] : [])];

  return [
    { url: siteUrl("/"), priority: 1 },
    ...pages.map((path) => ({ url: siteUrl(path) })),
    ...programs.map((slug) => ({ url: siteUrl(`/programs/${slug}`) })),
    ...courses.map((slug) => ({ url: siteUrl(`/courses/${slug}`) })),
    ...albums.map((slug) => ({ url: siteUrl(`/gallery/${slug}`) })),
    ...posts.map((p) => ({ url: siteUrl(`/blog/${p.slug}`), lastModified: p.updatedAt })),
  ];
}
