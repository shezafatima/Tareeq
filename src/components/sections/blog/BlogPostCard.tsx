import { Article } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import SafeImage from "@/components/ui/SafeImage";
import { formatPostDate, type PublicPostCard } from "@/lib/blog/view";

/** One post in a list: cover, category, title, excerpt, date and reading time. The whole card is one link, named by the title. */
export default function BlogPostCard({ post }: { post: PublicPostCard }) {
  const date = formatPostDate(post.publishedAt);
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-midnight/10 focus-within:ring-2 focus-within:ring-royal">
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-soft">
        {post.cover ? (
          <SafeImage
            src={post.cover.url}
            alt={post.cover.alt}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <span aria-hidden="true" className="flex size-full items-center justify-center text-royal/60">
            <Article size={40} weight="duotone" />
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
        {post.category ? <p className="text-xs font-semibold uppercase tracking-wide text-royal">{post.category.name}</p> : null}
        <h3 className="font-heading text-lg font-bold leading-snug text-midnight [overflow-wrap:anywhere]">
          <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {post.title}
          </Link>
        </h3>
        {post.excerpt ? <p className="line-clamp-3 text-sm text-midnight/80">{post.excerpt}</p> : null}
        <p className="mt-auto pt-1 text-sm text-midnight/75">
          {date ? <time dateTime={post.publishedAt}>{date}</time> : null}
          {date ? " · " : ""}
          {post.readingTime} min read
        </p>
      </div>
    </article>
  );
}
