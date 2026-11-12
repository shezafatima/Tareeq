import BlogPostCard from "@/components/sections/blog/BlogPostCard";
import Section from "@/components/sections/Section";
import Button from "@/components/ui/Button";
import ChevronRight from "@/components/ui/ChevronRight";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import { getPublishedCards } from "@/lib/blog/data";
import { pickForHome, type PublicPostCard } from "@/lib/blog/view";

const COUNT = 3;

/**
 * The latest posts on the home page, with a link to the whole blog. Featured posts come first. Renders nothing while no post is
 * published, or when the posts cannot be read, so the home page never shows an empty section (specs/033-admin-blog).
 */
export default async function BlogPreview() {
  let posts: PublicPostCard[];
  try {
    posts = pickForHome(await getPublishedCards(), COUNT);
  } catch (err) {
    console.error(`[blog] home read failed: ${err instanceof Error ? err.name : "UnknownError"}`);
    return null;
  }
  if (posts.length === 0) return null;

  return (
    <Section id="blog" labelledBy="blog-title" tone="paper" divider>
      <Reveal>
        <SectionHeading id="blog-title" eyebrow="From the blog" intro="Practical notes on teaching and learning with AI.">
          Latest reading
        </SectionHeading>
      </Reveal>
      <ul className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post, i) => (
          <Reveal as="li" key={post.slug} index={i}>
            <BlogPostCard post={post} />
          </Reveal>
        ))}
      </ul>
      <Reveal className="mt-10" index={posts.length}>
        <Button href="/blog" variant="secondary">
          View more
          <ChevronRight />
        </Button>
      </Reveal>
    </Section>
  );
}
