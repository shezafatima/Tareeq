import Link from "next/link";
import SafeImage from "@/components/ui/SafeImage";
import type { RenderedContent } from "@/lib/blog/markdown";
import { blogHref, formatPostDate } from "@/lib/blog/view";
import type { StoredImage } from "@/lib/images/shared";
import AuthorLine, { type AuthorPhoto } from "./AuthorLine";
import BlogProse from "./BlogProse";
import BlogToc from "./BlogToc";

/** What the view needs of a post: the same shape for a stored post and for the editor's unsaved values. */
export type PostViewData = {
  title: string;
  category: { name: string; slug: string } | null;
  /** ISO date, or null for a post that has never been published */
  publishedAt: string | null;
  readingTime: number;
  cover: StoredImage | null;
  tags: string[];
};

const pill =
  "inline-flex min-h-11 items-center rounded-pill bg-soft px-4 text-sm font-semibold text-royal hover:bg-royal hover:text-white";

/**
 * The whole post, shared by the public page, the preview page and the editor's live preview, so all three look the same
 * (specs/033-admin-blog FR-010, SC-006). `after` is filled by the pages that want share, related posts and the CTA. In `editor` mode
 * there is no table of contents, links do not navigate away and the title is not an h1, because the editor page has its own.
 * Server-safe: no hooks, so it renders on the server and inside the client-side preview.
 */
export default function BlogPostView({
  post,
  content,
  authorPhoto,
  mode,
  after,
}: {
  post: PostViewData;
  content: RenderedContent;
  authorPhoto: AuthorPhoto;
  mode: "public" | "editor";
  after?: React.ReactNode;
}) {
  const editor = mode === "editor";
  const Title = editor ? "h2" : "h1";
  const date = formatPostDate(post.publishedAt);
  const hasToc = !editor && content.headings.length >= 2;

  return (
    <article>
      <header className="mx-auto max-w-3xl">
        {post.category ? (
          editor ? (
            <p className="text-sm font-semibold uppercase tracking-wide text-royal">{post.category.name}</p>
          ) : (
            <Link href={blogHref({ category: post.category.slug })} className="inline-flex min-h-11 items-center text-sm font-semibold uppercase tracking-wide text-royal hover:underline">
              {post.category.name}
            </Link>
          )
        ) : null}
        <Title className="mt-1 font-heading text-3xl font-bold leading-tight text-midnight [overflow-wrap:anywhere] sm:text-4xl lg:text-5xl">
          {post.title.trim() || "Untitled post"}
        </Title>
        <div className="mt-5">
          <AuthorLine photo={authorPhoto}>
            {date ? <time dateTime={post.publishedAt ?? undefined}>{date}</time> : null}
            {date ? " · " : ""}
            {post.readingTime} min read
          </AuthorLine>
        </div>
      </header>

      {post.cover ? (
        <div className="mx-auto mt-8 max-w-4xl overflow-hidden rounded-card">
          <SafeImage
            src={post.cover.url}
            alt={post.cover.alt}
            width={post.cover.width}
            height={post.cover.height}
            sizes="(min-width: 1024px) 896px, 100vw"
            priority={!editor}
            className="h-auto w-full"
          />
        </div>
      ) : null}

      <div className={hasToc ? "mx-auto mt-10 grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,46rem)_16rem] lg:justify-center" : "mx-auto mt-10 max-w-3xl"}>
        <div className="min-w-0">
          <BlogProse content={content} />
          {post.tags.length > 0 ? (
            <ul className="mt-10 flex flex-wrap gap-2" aria-label="Tags">
              {post.tags.map((tag) => (
                <li key={tag}>
                  {editor ? <span className={pill}>#{tag}</span> : <Link href={blogHref({ tag })} className={pill}>#{tag}</Link>}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        {hasToc ? <aside className="hidden lg:block"><BlogToc headings={content.headings} /></aside> : null}
      </div>

      {after}
    </article>
  );
}
