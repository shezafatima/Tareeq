import { Article } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import SafeImage from "@/components/ui/SafeImage";
import { formatPostDate, type PublicPostCard } from "@/lib/blog/view";

/** The featured post, large, at the top of the first page of /blog (specs/033-admin-blog User Story 6). */
export default function BlogHero({ post }: { post: PublicPostCard }) {
  const date = formatPostDate(post.publishedAt);
  return (
    <section aria-labelledby="featured-heading">
      <h2 id="featured-heading" className="sr-only">
        Featured post
      </h2>
      <article className="group relative grid overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-midnight/10 focus-within:ring-2 focus-within:ring-royal md:grid-cols-2">
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-soft md:aspect-auto md:min-h-80">
          {post.cover ? (
            <SafeImage
              src={post.cover.url}
              alt={post.cover.alt}
              fill
              priority
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
          ) : (
            <span aria-hidden="true" className="flex size-full items-center justify-center text-royal/60">
              <Article size={56} weight="duotone" />
            </span>
          )}
        </div>
        <div className="flex flex-col justify-center gap-3 p-5 sm:p-8">
          {post.category ? <p className="text-xs font-semibold uppercase tracking-wide text-royal">{post.category.name}</p> : null}
          <h3 className="font-heading text-2xl font-bold leading-tight text-midnight [overflow-wrap:anywhere] lg:text-3xl">
            <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
              {post.title}
            </Link>
          </h3>
          {post.excerpt ? <p className="text-base text-midnight/85">{post.excerpt}</p> : null}
          <p className="text-sm text-midnight/75">
            {date ? <time dateTime={post.publishedAt}>{date}</time> : null}
            {date ? " · " : ""}
            {post.readingTime} min read
          </p>
        </div>
      </article>
    </section>
  );
}
