import type { PublicPostCard } from "@/lib/blog/view";
import BlogPostCard from "./BlogPostCard";

/** Posts as cards: one column on a phone, two from sm, three from lg. */
export default function BlogGrid({ posts, heading = "Latest posts" }: { posts: PublicPostCard[]; heading?: string }) {
  if (posts.length === 0) return null;
  return (
    <section aria-labelledby="posts-heading">
      <h2 id="posts-heading" className="sr-only">
        {heading}
      </h2>
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <li key={post.slug}>
            <BlogPostCard post={post} />
          </li>
        ))}
      </ul>
    </section>
  );
}
