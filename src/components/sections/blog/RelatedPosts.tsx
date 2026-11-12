import type { PublicPostCard } from "@/lib/blog/view";
import BlogPostCard from "./BlogPostCard";

/** Up to three more posts to read: same category first (specs/033-admin-blog FR-019). Nothing is drawn when there are none. */
export default function RelatedPosts({ posts }: { posts: PublicPostCard[] }) {
  if (posts.length === 0) return null;
  return (
    <section aria-labelledby="related-heading">
      <h2 id="related-heading" className="font-heading text-2xl font-bold text-midnight">
        More to read
      </h2>
      <ul className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <li key={post.slug}>
            <BlogPostCard post={post} />
          </li>
        ))}
      </ul>
    </section>
  );
}
