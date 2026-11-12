import Link from "next/link";
import Container from "@/components/ui/Container";
import type { RenderedContent } from "@/lib/blog/markdown";
import type { PublicPostCard } from "@/lib/blog/view";
import type { AuthorPhoto } from "./AuthorLine";
import BlogEndCta from "./BlogEndCta";
import BlogPostView, { type PostViewData } from "./BlogPostView";
import RelatedPosts from "./RelatedPosts";
import ShareButtons from "./ShareButtons";

/**
 * A whole post page body: back link, the post, share buttons, related posts and the end CTA. The public page and the owner's
 * preview page both render this, so the preview is exactly what readers will see (specs/033-admin-blog FR-017, SC-006).
 */
export default function BlogArticle({
  post,
  content,
  authorPhoto,
  url,
  related,
}: {
  post: PostViewData;
  content: RenderedContent;
  authorPhoto: AuthorPhoto;
  /** the post's absolute public address, for sharing */
  url: string;
  related: PublicPostCard[];
}) {
  return (
    <Container className="pb-section pt-8 lg:pt-12">
      <Link href="/blog" className="mb-6 inline-flex min-h-11 items-center text-sm font-semibold text-royal underline underline-offset-4">
        All posts
      </Link>
      <BlogPostView
        post={post}
        content={content}
        authorPhoto={authorPhoto}
        mode="public"
        after={
          <div className="mx-auto mt-12 max-w-3xl space-y-12">
            <ShareButtons title={post.title} url={url} />
            <RelatedPosts posts={related} />
            <BlogEndCta />
          </div>
        }
      />
    </Container>
  );
}
