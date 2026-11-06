import { renderMarkdown } from "@/lib/programs/markdown";

/** A program's description. renderMarkdown sanitizes on the server; this is the only raw HTML from stored content. */
export default function ProgramProse({ markdown }: { markdown: string }) {
  if (!markdown.trim()) return null;
  return <div className="program-prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(markdown) }} />;
}
