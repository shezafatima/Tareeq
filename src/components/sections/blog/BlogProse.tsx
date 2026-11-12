import Image from "next/image";
import type { RenderedContent } from "@/lib/blog/markdown";
import { BODY_IMAGE_SIZES } from "@/lib/blog/view";
import { optimizedUrl } from "@/lib/images/shared";

/**
 * A post's body. The HTML segments come from renderBlogMarkdown, which drops raw HTML and sanitises everything else, so they are the
 * only raw HTML from stored blog content (specs/033-admin-blog research R2). Stand-alone images go through next/image (research R3).
 * No hooks, so it renders in server pages and in the editor's client-side preview alike.
 */
export default function BlogProse({ content }: { content: RenderedContent }) {
  if (content.segments.length === 0) return null;
  return (
    <div className="blog-prose">
      {content.segments.map((segment, i) =>
        segment.kind === "html" ? (
          <div key={i} dangerouslySetInnerHTML={{ __html: segment.html }} />
        ) : (
          <Image
            key={i}
            src={optimizedUrl(segment.src)}
            alt={segment.alt}
            width={segment.width}
            height={segment.height}
            sizes={BODY_IMAGE_SIZES}
            loading="lazy"
          />
        ),
      )}
    </div>
  );
}
