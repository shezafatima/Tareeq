"use client"; // needs form state, transitions, dialogs, the router, timers and the browser's storage (autosave and restore)

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import type { AuthorPhoto } from "@/components/sections/blog/AuthorLine";
import CheckboxField from "@/components/ui/CheckboxField";
import Field from "@/components/ui/Field";
import SelectField from "@/components/ui/SelectField";
import TextareaField from "@/components/ui/TextareaField";
import { deleteBlogPost, saveBlogPost } from "@/lib/admin/blog-actions";
import { dayToDate, karachiDay, LIMITS, MESSAGES, parseBlogPost, publishIssues, slugify, type BlogPostFormValues, type FieldErrors } from "@/lib/admin/blog-schema";
import { browserStorage, clearDraft, moveDraft, readDraft, shouldOffer, writeDraft, type Draft } from "@/lib/blog/draft-storage";
import type { ImageSize } from "@/lib/blog/markdown";
import { readingMinutes, sizesFrom } from "@/lib/blog/view";
import { cn } from "@/lib/utils";
import BlogPreviewPane from "./BlogPreviewPane";
import ConfirmDialog from "./ConfirmDialog";
import DraftRestoreNotice from "./DraftRestoreNotice";
import ImageUploader from "./ImageUploader";
import MarkdownEditor, { type EditorApi } from "./MarkdownEditor";
import MarkdownImageButton from "./MarkdownImageButton";
import SeoPanel from "./SeoPanel";
import StatusChip from "./StatusChip";
import TagInput from "./TagInput";
import { useToast } from "./Toast";
import { useActionFeedback } from "./useActionFeedback";
import { useUnsavedChanges } from "./useUnsavedChanges";

type Category = { id: string; name: string; slug: string };

/** What the page knows about an already saved post. Absent for a new one. */
export type SavedInfo = {
  id: string;
  slug: string;
  status: "draft" | "published";
  updatedAt: string;
  publishedAtExact: string | null;
  contentImages: { url: string; width: number; height: number }[];
};

type Props = { initial: BlogPostFormValues; categories: Category[]; authorPhoto: AuthorPhoto; saved?: SavedInfo };

/** The fields that are the owner's text; the target status and the slug-follows-title flag are not. */
const content = (v: BlogPostFormValues) =>
  JSON.stringify([v.title, v.slug, v.excerpt, v.categoryId, v.tags, v.coverImage, v.featured, v.publishedAt, v.content, v.metaTitle, v.metaDescription]);

const ORDER = ["title", "slug", "excerpt", "categoryId", "tags", "coverImage", "publishedAt", "content", "metaTitle", "metaDescription"];

/** The element to focus for an error key such as `slug` or `coverImage.alt`. */
const idFor = (key: string): string => (key.startsWith("coverImage") ? "field-cover-alt" : key.startsWith("tags") ? "field-tags" : `field-${key.split(".")[0]}`);

const clock = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });

const darkButton = "inline-flex min-h-11 items-center justify-center rounded-full bg-midnight px-5 text-sm font-semibold text-white hover:bg-royal disabled:opacity-70";
const lightButton =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-midnight/70 bg-white px-5 text-sm font-semibold text-midnight hover:bg-midnight/5 disabled:opacity-70";

/**
 * The blog post editor (specs/033-admin-blog User Stories 1-4). One screen: details, the markdown editor with its live preview
 * (side by side from lg, Write/Preview tabs below), the search panel and the actions. Save, Publish and Unpublish all go through
 * saveBlogPost with the status being asked for, so what is on screen is always what is published.
 */
export default function BlogPostEditor({ initial, categories, authorPhoto, saved }: Props) {
  const router = useRouter();
  const toast = useToast();
  const fail = useActionFeedback();
  const editorRef = useRef<EditorApi>(null);

  const [values, setValues] = useState<BlogPostFormValues>(initial);
  const [baseline, setBaseline] = useState<BlogPostFormValues>(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [postId, setPostId] = useState<string | null>(saved?.id ?? null);
  const [savedStatus, setSavedStatus] = useState<"draft" | "published">(saved?.status ?? "draft");
  const [savedSlug, setSavedSlug] = useState(saved?.slug ?? "");
  const [savedAt, setSavedAt] = useState<string | null>(saved?.updatedAt ?? null);
  const [publishedAt, setPublishedAt] = useState<string | null>(saved?.publishedAtExact ?? null);
  // a new post's address follows its title until the owner edits the address; an existing one never changes by itself
  const [slugTouched, setSlugTouched] = useState(Boolean(saved));
  const [sizes, setSizes] = useState<Record<string, ImageSize>>(() => sizesFrom(saved?.contentImages));
  const [view, setView] = useState<"write" | "preview">("write");
  const [offer, setOffer] = useState<Draft | null>(null);
  const [saving, startSaving] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const dirty = content(values) !== content(baseline);
  useUnsavedChanges(dirty && !saving);

  const set = <K extends keyof BlogPostFormValues>(key: K, value: BlogPostFormValues[K]) => setValues((v) => ({ ...v, [key]: value }));

  // offer the browser copy of a crashed session once, after the first paint (storage does not exist on the server)
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const draft = readDraft(browserStorage(), saved?.id ?? null);
      if (draft && shouldOffer(draft, initial, saved?.updatedAt ?? null)) setOffer(draft);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [saved, initial]);

  // keep a browser copy while there are unsaved changes (FR-015); it is cleared by a save
  useEffect(() => {
    if (!dirty) return;
    const timer = window.setTimeout(() => writeDraft(browserStorage(), postId, values), 2000);
    return () => window.clearTimeout(timer);
  }, [dirty, values, postId]);

  const showErrors = (next: FieldErrors) => {
    setErrors(next);
    const first = Object.keys(next).sort((a, b) => ORDER.indexOf(a.split(".")[0]) - ORDER.indexOf(b.split(".")[0]))[0];
    if (!first) return;
    if (first === "content") setView("write");
    window.requestAnimationFrame(() => document.getElementById(idFor(first))?.focus());
  };

  /** `target` is the status being asked for: "keep" saves as the post is now. */
  const save = (target: "keep" | "draft" | "published") => {
    const status = target === "keep" ? savedStatus : target;
    const payload: BlogPostFormValues = { ...values, slugAuto: !postId && !slugTouched, status };
    const parsed = parseBlogPost(payload);
    if (!parsed.success) {
      showErrors(parsed.errors);
      toast.error("Please check the highlighted fields.");
      return;
    }
    if (status === "published") {
      const issues = publishIssues(payload);
      if (Object.keys(issues).length > 0) {
        showErrors(issues);
        toast.error("Fill in the highlighted fields to publish.");
        return;
      }
    }
    setErrors({});
    startSaving(async () => {
      const result = await saveBlogPost({ id: postId, values: payload });
      if (!result.ok) return showErrors(fail(result, "save the post"));
      const next: BlogPostFormValues = {
        ...values,
        slug: result.slug,
        publishedAt: result.publishedAt ? karachiDay(new Date(result.publishedAt)) : values.publishedAt,
        status: result.status,
      };
      setValues(next);
      setBaseline(next); // saved, so leaving is not "unsaved"
      setSavedStatus(result.status);
      setSavedSlug(result.slug);
      setSavedAt(result.updatedAt);
      setPublishedAt(result.publishedAt);
      setSlugTouched(true);
      const storage = browserStorage();
      if (!postId) moveDraft(storage, null, result.id);
      clearDraft(storage, result.id);
      clearDraft(storage, null);
      setOffer(null);
      const suffixed = !postId && result.slug !== values.slug;
      toast.success(
        target === "published"
          ? "Post published"
          : target === "draft" && savedStatus === "published"
            ? "Post unpublished. It is a draft again."
            : savedStatus === "published" || status === "published"
              ? "Changes saved"
              : suffixed
                ? `Draft saved at /blog/${result.slug} (that address was taken)`
                : "Draft saved",
      );
      if (!postId) {
        setPostId(result.id);
        router.replace(`/admin/blog/${result.id}`);
      }
      router.refresh();
    });
  };

  const confirmDelete = async () => {
    if (!postId) return;
    setDeleting(true);
    const result = await deleteBlogPost({ id: postId });
    setDeleting(false);
    setConfirming(false);
    if (result.ok) {
      setBaseline(values); // deleted, so leaving is not "unsaved"
      clearDraft(browserStorage(), postId);
      toast.success("Post deleted");
      router.push("/admin/blog");
      router.refresh();
    } else fail(result, "delete it");
  };

  const restore = () => {
    if (!offer) return;
    setValues({ ...offer.values, slugAuto: false, status: savedStatus });
    setSlugTouched(true);
    setOffer(null);
    toast.success("Unsaved changes restored. Save to keep them.");
  };

  const discard = () => {
    clearDraft(browserStorage(), postId);
    setOffer(null);
  };

  const category = categories.find((c) => c.id === values.categoryId) ?? null;
  const previewDate = values.publishedAt ? dayToDate(values.publishedAt).toISOString() : publishedAt;
  const published = savedStatus === "published";
  const slugWarning = published && savedSlug !== "" && values.slug !== savedSlug;
  const e = (key: string) => errors[key];

  const onTabKey = (ev: React.KeyboardEvent) => {
    if (ev.key !== "ArrowRight" && ev.key !== "ArrowLeft") return;
    ev.preventDefault();
    const next = view === "write" ? "preview" : "write";
    setView(next);
    document.getElementById(`tab-${next}`)?.focus();
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <StatusChip label={published ? "Published" : "Draft"} tone={published ? "royal" : "grey"} />
          <p className="text-sm text-midnight/75">
            {savedAt ? `Last saved ${clock.format(new Date(savedAt))}` : "Not saved yet"}
            {dirty ? " · unsaved changes" : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {postId ? (
            <a href={`/blog/preview/${postId}`} target="_blank" rel="noopener noreferrer" className={lightButton}>
              Preview<span className="sr-only"> (opens in a new tab, shows the last saved version)</span>
            </a>
          ) : (
            <span className={cn(lightButton, "cursor-not-allowed opacity-60")} aria-disabled="true">
              Preview
              <span className="sr-only"> (save once to preview)</span>
            </span>
          )}
          {postId ? (
            <button type="button" onClick={() => setConfirming(true)} className="min-h-11 rounded-full px-4 text-sm font-semibold text-danger hover:bg-danger/10">
              Delete
            </button>
          ) : null}
        </div>
      </div>
      {!postId ? <p className="-mt-3 text-xs text-midnight/70">Save once to preview. The preview shows the last saved version.</p> : null}

      {offer ? <DraftRestoreNotice savedAt={offer.savedAt} onRestore={restore} onDiscard={discard} /> : null}

      <form
        onSubmit={(ev) => {
          ev.preventDefault();
          save("keep");
        }}
        noValidate
        className="space-y-6"
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="min-w-0 space-y-5">
            <Field
              label="Title"
              name="title"
              required
              value={values.title}
              error={e("title")}
              maxLength={LIMITS.title + 20}
              onChange={(ev) => {
                set("title", ev.target.value);
                if (!slugTouched) set("slug", slugify(ev.target.value));
              }}
            />
            <Field
              label="Web address (slug)"
              name="slug"
              required
              value={values.slug}
              error={e("slug")}
              help={slugWarning ? "Changing the address of a published post breaks links already shared." : `Shown as /blog/${values.slug || "…"}`}
              onChange={(ev) => {
                setSlugTouched(true);
                set("slug", ev.target.value);
              }}
            />
            <TextareaField
              label="Excerpt"
              name="excerpt"
              value={values.excerpt}
              error={e("excerpt")}
              help={`${LIMITS.excerpt - values.excerpt.length} characters left. Shown on the blog page and in link previews.`}
              onChange={(ev) => set("excerpt", ev.target.value.slice(0, LIMITS.excerpt))}
            />
          </div>
          <div className="min-w-0 space-y-5">
            <div>
              <SelectField
                label="Category"
                name="categoryId"
                value={values.categoryId}
                error={e("categoryId")}
                placeholderOption="No category"
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
                onChange={(ev) => set("categoryId", ev.target.value)}
              />
              {categories.length === 0 ? (
                <p className="mt-1.5 text-sm text-midnight/70">
                  No categories yet.{" "}
                  <Link href="/admin/blog/categories" className="font-semibold text-royal underline underline-offset-4">
                    Add one
                  </Link>
                </p>
              ) : null}
            </div>
            <TagInput label="Tags" value={values.tags} error={e("tags") ?? e("tags.0")} onChange={(tags) => set("tags", tags)} />
            <Field
              label="Publish date"
              name="publishedAt"
              type="date"
              value={values.publishedAt}
              error={e("publishedAt")}
              help="Set automatically the first time you publish. You can change it."
              onChange={(ev) => set("publishedAt", ev.target.value)}
            />
            <CheckboxField label="Feature this post" name="featured" checked={values.featured} note="The newest featured post is shown first on the blog page." onChange={(ev) => set("featured", ev.target.checked)} />
          </div>
        </div>

        <ImageUploader
          label="Cover image"
          scope="blog"
          value={values.coverImage}
          onChange={(img) => set("coverImage", img)}
          error={e("coverImage") ?? e("coverImage.alt") ?? (errors.cover ? MESSAGES.cover : undefined)}
          recommended="1600 x 900 px, landscape (16:9)"
          id="field-cover"
        />

        <div>
          <div role="tablist" aria-label="Editor view" onKeyDown={onTabKey} className="mb-3 flex gap-2 lg:hidden">
            {(["write", "preview"] as const).map((tab) => (
              <button
                key={tab}
                id={`tab-${tab}`}
                role="tab"
                type="button"
                aria-selected={view === tab}
                aria-controls={`panel-${tab}`}
                tabIndex={view === tab ? 0 : -1}
                onClick={() => setView(tab)}
                className={cn(
                  "min-h-11 flex-1 rounded-full px-5 text-sm font-semibold",
                  view === tab ? "bg-midnight text-white" : "border border-midnight/70 text-midnight hover:bg-midnight/5",
                )}
              >
                {tab === "write" ? "Write" : "Preview"}
              </button>
            ))}
          </div>
          <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
            <div id="panel-write" role="tabpanel" aria-labelledby="tab-write" className={cn("min-w-0", view !== "write" && "hidden lg:block")}>
              <MarkdownEditor
                value={values.content}
                onChange={(next) => set("content", next)}
                error={e("content")}
                editorRef={editorRef}
                imageButton={
                  <MarkdownImageButton editorRef={editorRef} onUploaded={(img) => setSizes((s) => ({ ...s, [img.url]: { width: img.width, height: img.height } }))} />
                }
              />
            </div>
            <div id="panel-preview" role="tabpanel" aria-labelledby="tab-preview" className={cn("min-w-0", view !== "preview" && "hidden lg:block")}>
              <BlogPreviewPane
                post={{
                  title: values.title,
                  category: category ? { name: category.name, slug: category.slug } : null,
                  publishedAt: previewDate,
                  readingTime: readingMinutes(values.content),
                  cover: values.coverImage,
                  tags: values.tags,
                }}
                content={values.content}
                sizes={sizes}
                authorPhoto={authorPhoto}
              />
            </div>
          </div>
        </div>

        <SeoPanel
          metaTitle={values.metaTitle}
          metaDescription={values.metaDescription}
          title={values.title}
          excerpt={values.excerpt}
          slug={values.slug}
          errors={{ metaTitle: e("metaTitle"), metaDescription: e("metaDescription") }}
          onChange={(key, value) => set(key, value)}
        />

        <div className="fixed inset-x-0 bottom-0 z-30 flex flex-wrap gap-3 border-t border-midnight/10 bg-white/95 p-3 backdrop-blur lg:static lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          <button type="submit" disabled={saving} aria-busy={saving} className={darkButton}>
            {saving ? "Saving…" : published ? "Save changes" : "Save draft"}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => save(published ? "draft" : "published")}
            className={lightButton}
          >
            {published ? "Unpublish" : "Publish"}
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={confirming}
        title="Delete this post?"
        body="The post will be removed for good, together with its cover image. This can't be undone."
        confirmLabel="Delete"
        pending={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}
