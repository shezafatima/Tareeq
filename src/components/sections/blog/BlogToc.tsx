import type { Heading } from "@/lib/blog/markdown";
import { cn } from "@/lib/utils";
import TocHighlight from "./TocHighlight";

/**
 * "On this page": the post's h2/h3 headings as links, sticky beside the text. The caller shows it from lg only, and only for a post
 * with at least two headings (specs/033-admin-blog FR-019).
 */
export default function BlogToc({ headings }: { headings: Heading[] }) {
  if (headings.length < 2) return null;
  return (
    <nav aria-label="On this page" className="sticky top-[calc(var(--header-h)+1.5rem)] max-h-[calc(100svh-var(--header-h)-3rem)] overflow-y-auto">
      <p className="font-heading text-sm font-bold uppercase tracking-wide text-midnight">On this page</p>
      <TocHighlight ids={headings.map((h) => h.id)}>
        <ul className="mt-3 space-y-1 border-l border-midnight/15">
          {headings.map((h) => (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                className={cn(
                  "-ml-px block border-l-2 border-transparent py-1.5 pr-2 text-sm text-midnight/80 hover:text-royal aria-[current=location]:border-royal aria-[current=location]:font-semibold aria-[current=location]:text-royal",
                  h.level === 3 ? "pl-7" : "pl-4",
                )}
              >
                {h.text}
              </a>
            </li>
          ))}
        </ul>
      </TocHighlight>
    </nav>
  );
}
