"use client"; // calls the preview Server Action after typing stops and keeps the last good result on screen

import { useEffect, useRef, useState } from "react";
import BlogPostView, { type PostViewData } from "@/components/sections/blog/BlogPostView";
import type { AuthorPhoto } from "@/components/sections/blog/AuthorLine";
import { renderBlogPreview } from "@/lib/admin/blog-actions";
import type { ImageSize, RenderedContent } from "@/lib/blog/markdown";

const DELAY_MS = 400;
const EMPTY: RenderedContent = { segments: [], headings: [] };

/**
 * The live preview (specs/033-admin-blog FR-010, research R5): the real BlogPostView fed by the editor's values, with the body
 * rendered by the same server function the public page uses. Answers that arrive out of order are dropped, and a failed call keeps
 * the last good preview instead of blanking it.
 */
export default function BlogPreviewPane({
  post,
  content,
  sizes,
  authorPhoto,
}: {
  post: PostViewData;
  content: string;
  sizes: Record<string, ImageSize>;
  authorPhoto: AuthorPhoto;
}) {
  const [rendered, setRendered] = useState<RenderedContent>(EMPTY);
  // what the shown preview was rendered from; busy is derived from it, so no state is set while the effect starts
  const [shownFor, setShownFor] = useState<{ content: string; sizes: Record<string, ImageSize> } | null>(null);
  const [failed, setFailed] = useState(false);
  const busy = !shownFor || shownFor.content !== content || shownFor.sizes !== sizes;
  const request = useRef(0);
  const first = useRef(true);

  useEffect(() => {
    const mine = ++request.current;
    const delay = first.current ? 0 : DELAY_MS;
    first.current = false;
    const timer = window.setTimeout(async () => {
      try {
        const result = await renderBlogPreview({ markdown: content, sizes });
        if (mine !== request.current) return;
        if (result.ok) {
          setRendered({ segments: result.segments, headings: result.headings });
          setFailed(false);
        } else setFailed(true);
      } catch {
        if (mine === request.current) setFailed(true);
      }
      if (mine === request.current) setShownFor({ content, sizes });
    }, delay);
    return () => window.clearTimeout(timer);
  }, [content, sizes]);

  return (
    <section aria-label="Preview of the post" className="min-w-0">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-midnight/70">Preview</p>
        <p role="status" className="text-xs text-midnight/70">
          {failed ? "Preview unavailable. Showing the last version." : busy ? "Updating…" : ""}
        </p>
      </div>
      <div className="max-h-[80vh] overflow-y-auto rounded-card bg-paper p-4 ring-1 ring-midnight/10 sm:p-6" inert>
        <BlogPostView post={post} content={rendered} authorPhoto={authorPhoto} mode="editor" />
      </div>
    </section>
  );
}
