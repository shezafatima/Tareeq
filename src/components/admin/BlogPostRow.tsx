import { Star } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { AdminPostRow } from "@/lib/admin/blog-read";
import { formatPostDate } from "@/lib/blog/view";
import { optimizedUrl } from "@/lib/images/shared";
import StatusChip from "./StatusChip";

/**
 * One post in the admin list (specs/033-admin-blog User Story 5): cover thumbnail, title, category, status, publish date and a star
 * when featured. The whole row opens the editor. Stacks on a phone, so nothing needs a sideways scroll at 360px.
 */
export default function BlogPostRow({ post }: { post: AdminPostRow }) {
  const published = post.status === "published";
  const date = formatPostDate(post.publishedAt);
  return (
    <li>
      <Link
        href={`/admin/blog/${post.id}`}
        className="flex flex-col gap-3 p-4 hover:bg-soft/50 focus-visible:outline-2 focus-visible:outline-royal sm:flex-row sm:items-center"
      >
        {post.cover ? (
          // a plain img: a small Cloudinary thumbnail in the admin, shown at a fixed size
          // eslint-disable-next-line @next/next/no-img-element
          <img src={optimizedUrl(post.cover.url, 160)} alt="" width={64} height={40} className="h-10 w-16 shrink-0 rounded-md bg-soft object-cover" />
        ) : (
          <span aria-hidden="true" className="flex h-10 w-16 shrink-0 items-center justify-center rounded-md bg-soft text-xs text-midnight/60">
            No cover
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-heading font-semibold text-midnight [overflow-wrap:anywhere]">{post.title}</p>
          <p className="mt-0.5 text-sm text-midnight/75">
            {post.category?.name ?? "No category"} · <span className="break-all">/{post.slug}</span>
          </p>
        </div>
        <div className="flex items-center gap-3 sm:justify-end">
          <StatusChip label={published ? "Published" : "Draft"} tone={published ? "royal" : "grey"} />
          <span className="min-w-[5.5rem] text-sm text-midnight/80">{date || "—"}</span>
          {post.featured ? (
            <span role="img" aria-label="Featured" title="Featured">
              <Star weight="fill" size={20} aria-hidden="true" className="text-saffron" />
            </span>
          ) : (
            <span aria-hidden="true" className="inline-block w-5" />
          )}
        </div>
      </Link>
    </li>
  );
}
