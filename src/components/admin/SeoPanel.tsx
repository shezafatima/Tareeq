"use client"; // live counters and a snippet preview that follow the typed values

import Field from "@/components/ui/Field";
import TextareaField from "@/components/ui/TextareaField";
import { LIMITS } from "@/lib/admin/blog-schema";
import { siteUrl } from "@/lib/seo";

const clip = (text: string, max: number): string => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);

/**
 * Search title and description with counters, and a Google-style preview of the result (specs/033-admin-blog FR-012). Both are
 * optional: empty falls back to the post's title and excerpt, and the preview shows exactly that.
 * The counters are only announced when a field first goes over the recommended length.
 */
export default function SeoPanel({
  metaTitle,
  metaDescription,
  title,
  excerpt,
  slug,
  errors,
  onChange,
}: {
  metaTitle: string;
  metaDescription: string;
  title: string;
  excerpt: string;
  slug: string;
  errors: { metaTitle?: string; metaDescription?: string };
  onChange: (key: "metaTitle" | "metaDescription", value: string) => void;
}) {
  const shownTitle = metaTitle.trim() || title.trim() || "Post title";
  const shownDescription = metaDescription.trim() || excerpt.trim() || "The excerpt appears here until you write a search description.";
  const titleOver = metaTitle.length > LIMITS.metaTitleAdvice;
  const descriptionOver = metaDescription.length > LIMITS.metaDescriptionAdvice;
  const crumb = `${siteUrl("/blog").replace(/^https?:\/\//, "").replace(/\/blog$/, "")} › blog › ${slug || "post-address"}`;

  return (
    <section aria-labelledby="seo-heading" className="space-y-4 rounded-card bg-white p-4 ring-1 ring-midnight/10 sm:p-5">
      <div>
        <h2 id="seo-heading" className="font-heading text-lg font-bold text-midnight">
          Search appearance
        </h2>
        <p className="mt-1 text-sm text-midnight/75">Optional. Left empty, the post title and excerpt are used.</p>
      </div>

      <Field
        label="Search title"
        name="metaTitle"
        value={metaTitle}
        error={errors.metaTitle}
        maxLength={LIMITS.metaTitle}
        help={`${metaTitle.length} / ${LIMITS.metaTitleAdvice} recommended${titleOver ? ". Longer titles may be cut off in search results." : "."}`}
        onChange={(e) => onChange("metaTitle", e.target.value)}
      />
      <TextareaField
        label="Search description"
        name="metaDescription"
        value={metaDescription}
        error={errors.metaDescription}
        help={`${metaDescription.length} / ${LIMITS.metaDescriptionAdvice} recommended${descriptionOver ? ". Longer descriptions may be cut off in search results." : "."}`}
        onChange={(e) => onChange("metaDescription", e.target.value.slice(0, LIMITS.metaDescription))}
      />
      <p role="status" className="sr-only">
        {titleOver ? "The search title is longer than recommended. " : ""}
        {descriptionOver ? "The search description is longer than recommended." : ""}
      </p>

      <figure aria-label="How this post may look in search results" className="rounded-control bg-paper p-4 ring-1 ring-midnight/10">
        <figcaption className="text-xs font-semibold uppercase tracking-wide text-midnight/70">Search result preview</figcaption>
        <p className="mt-2 truncate text-xs text-midnight/70">{crumb}</p>
        <p className="mt-0.5 text-lg leading-snug text-sky [overflow-wrap:anywhere]">{clip(shownTitle, 60)}</p>
        <p className="mt-0.5 text-sm text-midnight/80 [overflow-wrap:anywhere]">{clip(shownDescription, 160)}</p>
      </figure>
    </section>
  );
}
