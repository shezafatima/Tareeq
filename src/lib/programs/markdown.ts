// Renders a program's description. Marked turns markdown into HTML; sanitize-html then keeps only the allowlist below,
// so stored content cannot run script or carry unsafe links. Used by Server Components only.
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

// exported so the blog can widen the same allowlist (specs/033-admin-blog research R2); program output does not change
export const BASE_SANITIZE: sanitizeHtml.IOptions = {
  allowedTags: ["h2", "h3", "h4", "p", "ul", "ol", "li", "strong", "em", "a", "blockquote", "code", "pre", "br", "hr"],
  allowedAttributes: { a: ["href", "title", "rel"] },
  allowedSchemes: ["http", "https", "mailto"],
  allowProtocolRelative: false,
  transformTags: {
    // the page title is the only h1
    h1: "h2",
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
  },
};

export function renderMarkdown(markdown: string): string {
  return sanitizeHtml(marked.parse(markdown, { async: false, gfm: true }), BASE_SANITIZE);
}
