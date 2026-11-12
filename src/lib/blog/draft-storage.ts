// The editor's browser copy of unsaved work (specs/033-admin-blog FR-015, research R14). Kept only in the owner's browser, so a crashed
// tab can be recovered. Every access is wrapped in try/catch: storage can be missing, blocked or full, and the editor must work
// without it. Pure apart from `browserStorage`: relative imports only.
import type { BlogPostFormValues } from "../admin/blog-schema.ts";

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;
export type Draft = { v: 1; savedAt: string; values: BlogPostFormValues };

export const draftKey = (id: string | null): string => `tareeq:blog-draft:${id ?? "new"}`;

/** The browser's localStorage, or null when it is missing or blocked (private window, site data off). */
export function browserStorage(): StorageLike | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

const isString = (v: unknown): v is string => typeof v === "string";

function isFormValues(v: unknown): v is BlogPostFormValues {
  const o = v as Record<string, unknown> | null;
  if (!o || typeof o !== "object") return false;
  const cover = o.coverImage as Record<string, unknown> | null | undefined;
  return (
    ["title", "slug", "excerpt", "categoryId", "publishedAt", "content", "metaTitle", "metaDescription"].every((k) => isString(o[k])) &&
    Array.isArray(o.tags) &&
    o.tags.every(isString) &&
    typeof o.featured === "boolean" &&
    (o.status === "draft" || o.status === "published") &&
    (cover === null || (typeof cover === "object" && isString(cover.url) && isString(cover.publicId)))
  );
}

/** Saves the copy. False when nothing could be stored. */
export function writeDraft(storage: StorageLike | null, id: string | null, values: BlogPostFormValues, now: Date = new Date()): boolean {
  if (!storage) return false;
  try {
    const draft: Draft = { v: 1, savedAt: now.toISOString(), values };
    storage.setItem(draftKey(id), JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

export function clearDraft(storage: StorageLike | null, id: string | null): void {
  try {
    storage?.removeItem(draftKey(id));
  } catch {
    /* storage unavailable: nothing to clear */
  }
}

/** The copy for a post, or null when there is none or it is not one of ours (a bad copy is removed). */
export function readDraft(storage: StorageLike | null, id: string | null): Draft | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(draftKey(id));
    if (raw === null) return null;
    const parsed = JSON.parse(raw) as Partial<Draft> | null;
    if (parsed && parsed.v === 1 && isString(parsed.savedAt) && !Number.isNaN(Date.parse(parsed.savedAt)) && isFormValues(parsed.values)) {
      return parsed as Draft;
    }
    clearDraft(storage, id);
    return null;
  } catch {
    clearDraft(storage, id);
    return null;
  }
}

/** After a new post's first save, its copy moves from the "new" key to the post's own key. */
export function moveDraft(storage: StorageLike | null, from: string | null, to: string): void {
  const draft = readDraft(storage, from);
  if (!draft) return;
  writeDraft(storage, to, draft.values, new Date(draft.savedAt));
  clearDraft(storage, from);
}

const CONTENT_KEYS = ["title", "slug", "excerpt", "categoryId", "tags", "coverImage", "featured", "publishedAt", "content", "metaTitle", "metaDescription"] as const;

/** True when the copy holds different text than the saved post AND was taken after the post was last saved. */
export function shouldOffer(draft: Draft, saved: BlogPostFormValues, savedUpdatedAt: string | null): boolean {
  if (savedUpdatedAt && Date.parse(draft.savedAt) <= Date.parse(savedUpdatedAt)) return false;
  return CONTENT_KEYS.some((k) => JSON.stringify(draft.values[k]) !== JSON.stringify(saved[k]));
}
