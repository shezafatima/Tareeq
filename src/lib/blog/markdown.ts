// Renders a blog post (specs/033-admin-blog research R2, R3, R6). Same marked + sanitize-html as the programs renderer, with a wider
// allowlist: images from our own image store only, tables, anchored headings. Raw HTML is never rendered: marked's html tokens are
// replaced with nothing before the sanitizer sees the output, so it only ever sees markup this file produced.
// Returns segments so a stand-alone image can go through next/image, and the h2/h3 list for the table of contents.
// Pure: relative imports only. Used on the server (pages, preview, the editor's preview action).
import { Marked, type Token, type Tokens } from "marked";
import sanitizeHtml from "sanitize-html";
import { optimizedUrl, publicIdFromUrl } from "../images/shared.ts";
import { BASE_SANITIZE } from "../programs/markdown.ts";
import { slugify } from "../admin/programs-schema.ts";
import { BODY_IMAGE_SIZES } from "./view.ts";

export type ImageSize = { width: number; height: number };
export type Heading = { id: string; text: string; level: 2 | 3 };
export type Segment =
  | { kind: "html"; html: string }
  | { kind: "image"; src: string; alt: string; width: number; height: number };
export type RenderedContent = { segments: Segment[]; headings: Heading[] };

const SRCSET_WIDTHS = [480, 800, 1200];

const escapeAttr = (s: string): string => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const decode = (s: string): string =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
const plainText = (html: string): string => decode(sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })).replace(/\s+/g, " ").trim();

const knownSize = (s: ImageSize | undefined): s is ImageSize =>
  Boolean(s) && Number.isInteger(s!.width) && Number.isInteger(s!.height) && s!.width > 0 && s!.height > 0;

function sanitizerFor(cloudName: string | undefined): sanitizeHtml.IOptions {
  return {
    ...BASE_SANITIZE,
    allowedTags: [...(BASE_SANITIZE.allowedTags as string[]), "img", "table", "thead", "tbody", "tr", "th", "td", "del"],
    allowedAttributes: {
      ...BASE_SANITIZE.allowedAttributes,
      h2: ["id"],
      h3: ["id"],
      h4: ["id"],
      th: ["align"],
      td: ["align"],
      img: ["src", "srcset", "sizes", "alt", "width", "height", "loading", "decoding"],
    },
    allowedClasses: { code: ["language-*"] },
    allowedSchemesByTag: { img: ["https"] },
    // the renderer already refuses foreign images; this is the second lock
    exclusiveFilter: (frame) => frame.tag === "img" && publicIdFromUrl(frame.attribs.src ?? "", cloudName) === null,
  };
}

export function renderBlogMarkdown(markdown: string, sizes: Record<string, ImageSize> = {}, opts: { cloudName?: string } = {}): RenderedContent {
  const cloudName = opts.cloudName ?? process.env.CLOUDINARY_CLOUD_NAME ?? undefined;
  const sanitizer = sanitizerFor(cloudName);
  const used = new Set<string>();
  const headings: Heading[] = [];

  const uniqueId = (text: string): string => {
    const base = slugify(text) || "section";
    let id = /^[0-9]/.test(base) || !slugify(text) ? `s-${base}` : base;
    for (let n = 2; used.has(id); n++) id = `${base.startsWith("s-") || id.startsWith("s-") ? "s-" : ""}${base}-${n}`;
    used.add(id);
    return id;
  };

  const marked = new Marked({
    gfm: true,
    async: false,
    renderer: {
      html: () => "",
      heading(this: { parser: { parseInline(t: Token[]): string } }, token: Tokens.Heading) {
        const inner = this.parser.parseInline(token.tokens);
        const level = Math.min(4, Math.max(2, token.depth));
        const text = plainText(inner);
        const id = uniqueId(text);
        if (level === 2 || level === 3) headings.push({ id, text, level });
        return `<h${level} id="${id}">${inner}</h${level}>\n`;
      },
      image(token: Tokens.Image) {
        if (publicIdFromUrl(token.href, cloudName) === null) return "";
        const size = sizes[token.href];
        const dims = knownSize(size) ? ` width="${size.width}" height="${size.height}"` : "";
        const srcset = SRCSET_WIDTHS.map((w) => `${optimizedUrl(token.href, w)} ${w}w`).join(", ");
        return `<img src="${escapeAttr(optimizedUrl(token.href, 1200))}" srcset="${escapeAttr(srcset)}" sizes="${BODY_IMAGE_SIZES}" alt="${escapeAttr(token.text)}"${dims} loading="lazy" decoding="async">`;
      },
    },
  });

  const toHtml = (tokens: Token[]): string => {
    const clean = sanitizeHtml(marked.parser(tokens), sanitizer);
    // Added after sanitising, on markup this file produced: code blocks and tables scroll sideways inside their own box, so each
    // is a labelled region the keyboard can reach and scroll (WCAG 2.1.1) instead of making the page scroll.
    return clean
      .replace(/<table>/g, '<div class="blog-table" role="region" aria-label="Table" tabindex="0"><table>')
      .replace(/<\/table>/g, "</table></div>")
      .replace(/<pre>/g, '<pre role="region" aria-label="Code" tabindex="0">')
      .replace(/<p>\s*<\/p>/g, "");
  };

  const segments: Segment[] = [];
  const pushHtml = (html: string) => {
    if (!html.trim()) return;
    const last = segments[segments.length - 1];
    if (last?.kind === "html") last.html += html;
    else segments.push({ kind: "html", html });
  };

  for (const token of marked.lexer(String(markdown ?? ""))) {
    if (token.type === "space") continue;
    if (token.type === "paragraph" && token.tokens?.length === 1 && token.tokens[0].type === "image") {
      const image = token.tokens[0] as Tokens.Image;
      const size = sizes[image.href];
      if (publicIdFromUrl(image.href, cloudName) !== null && knownSize(size)) {
        segments.push({ kind: "image", src: image.href, alt: image.text, width: size.width, height: size.height });
        continue;
      }
    }
    pushHtml(toHtml([token]));
  }
  return { segments, headings };
}

/** The distinct image addresses in a post, in order (text image syntax anywhere, including inside lists and quotes). */
export function imageUrlsIn(markdown: string): string[] {
  const urls: string[] = [];
  const walk = (tokens: Token[] | undefined) => {
    for (const t of tokens ?? []) {
      if (t.type === "image") {
        const href = (t as Tokens.Image).href;
        if (href && !urls.includes(href)) urls.push(href);
      }
      const nested = t as { tokens?: Token[]; items?: Token[] };
      walk(nested.tokens);
      walk(nested.items);
    }
  };
  walk(new Marked({ gfm: true, async: false }).lexer(String(markdown ?? "")));
  return urls;
}
