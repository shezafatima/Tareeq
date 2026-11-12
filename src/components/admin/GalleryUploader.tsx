"use client"; // needs file and drag events, a queue with per-file state, XHR progress and a leave-page warning

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addGalleryPhoto } from "@/lib/admin/gallery-actions";
import { signUpload } from "@/lib/admin/images-actions";
import { IMAGE_LIMITS, IMAGE_MESSAGES, validateFile } from "@/lib/images/shared";
import { uploadToCloudinary } from "@/lib/images/upload-client";
import { cn } from "@/lib/utils";
import StatusChip, { type ChipTone } from "./StatusChip";

// Multi-file upload for one album (specs/032-admin-gallery contracts/routes-and-ui.md). Each file goes straight to Cloudinary with a
// signature from signUpload, then addGalleryPhoto records it after the server has checked it. At most 3 run at a time; a failed file
// never stops the others and can be retried.

type ItemState = "waiting" | "uploading" | "done" | "failed";
type Item = { key: string; file: File; state: ItemState; percent: number; error?: string };

const CONCURRENCY = 3;
const ACCEPT = "image/jpeg,image/png,image/webp";
const CONSENT_NOTICE = "Only upload photos of children with parent/school consent.";
const STATE_LABEL: Record<ItemState, { text: string; tone: ChipTone }> = {
  waiting: { text: "Waiting", tone: "grey" },
  uploading: { text: "Uploading", tone: "sky" },
  done: { text: "Done", tone: "royal" },
  failed: { text: "Failed", tone: "saffron" },
};

const button =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-midnight/20 px-4 text-sm font-semibold text-midnight hover:border-royal hover:text-royal disabled:opacity-60";

export default function GalleryUploader({ albumId, configured }: { albumId: string; configured: boolean }) {
  const router = useRouter();
  const baseId = useId().replace(/:/g, "");
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [dragging, setDragging] = useState(false);
  const itemsRef = useRef<Item[]>([]);
  const controllers = useRef(new Map<string, AbortController>());
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const apply = useCallback((update: (list: Item[]) => Item[]) => {
    itemsRef.current = update(itemsRef.current);
    setItems(itemsRef.current);
  }, []);
  const patch = useCallback((key: string, change: Partial<Item>) => apply((list) => list.map((i) => (i.key === key ? { ...i, ...change } : i))), [apply]);

  // the list of photos below is rendered on the server, so ask for it again, but not once per file
  const refreshSoon = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => router.refresh(), 800);
  }, [router]);

  const run = useCallback(
    async (item: Item) => {
      const problem = validateFile(item.file);
      if (problem) return patch(item.key, { state: "failed", error: problem });
      patch(item.key, { state: "uploading", percent: 0, error: undefined });
      const controller = new AbortController();
      controllers.current.set(item.key, controller);
      try {
        const signed = await signUpload({ scope: "gallery" });
        if (!signed.ok) {
          const message =
            signed.code === "unauthorized"
              ? "Your session has ended. Please sign in again."
              : signed.code === "not_configured"
                ? IMAGE_MESSAGES.notConfigured
                : IMAGE_MESSAGES.uploadFailed;
          return patch(item.key, { state: "failed", error: message });
        }
        const asset = await uploadToCloudinary(item.file, signed.upload, {
          signal: controller.signal,
          onProgress: (percent) => patch(item.key, { percent }),
        });
        const saved = await addGalleryPhoto({ albumId, publicId: asset.publicId });
        if (saved.ok) {
          patch(item.key, { state: "done", percent: 100 });
          refreshSoon();
        } else {
          const message =
            saved.code === "unauthorized"
              ? "Your session has ended. Please sign in again."
              : saved.code === "image_rejected"
                ? IMAGE_MESSAGES.rejected
                : saved.code === "not_found"
                  ? "This album no longer exists."
                  : IMAGE_MESSAGES.uploadFailed;
          patch(item.key, { state: "failed", error: message });
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        patch(item.key, { state: "failed", error: IMAGE_MESSAGES.uploadFailed });
      } finally {
        controllers.current.delete(item.key);
      }
    },
    [albumId, patch, refreshSoon],
  );

  // the pump: keep up to CONCURRENCY files uploading. Runs whenever the list changes.
  useEffect(() => {
    const active = items.filter((i) => i.state === "uploading").length;
    const next = items.filter((i) => i.state === "waiting").slice(0, Math.max(0, CONCURRENCY - active));
    for (const item of next) {
      patch(item.key, { state: "uploading" }); // claim it at once so the next pass does not start it twice
      void run(item);
    }
  }, [items, patch, run]);

  const busy = items.some((i) => i.state === "waiting" || i.state === "uploading");
  useEffect(() => {
    if (!busy) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy]);

  useEffect(() => {
    const live = controllers.current;
    return () => {
      for (const c of live.values()) c.abort();
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, []);

  const add = (files: FileList | File[] | null) => {
    const list = files ? Array.from(files) : [];
    if (list.length === 0) return;
    apply((current) => [
      ...current,
      ...list.map((file, n) => ({ key: `${Date.now()}-${n}-${file.name}`, file, state: "waiting" as ItemState, percent: 0 })),
    ]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const retry = (key: string) => patch(key, { state: "waiting", percent: 0, error: undefined });
  const clearFinished = () => apply((list) => list.filter((i) => i.state !== "done"));

  const total = items.length;
  const doneCount = items.filter((i) => i.state === "done").length;
  const hint = `JPG, PNG or WebP, up to ${IMAGE_LIMITS.maxBytes / (1024 * 1024)} MB each.`;

  return (
    <div className="min-w-0 space-y-3">
      <p role="note" className="rounded-xl bg-saffron/25 px-4 py-3 text-sm font-semibold text-midnight ring-1 ring-saffron/60">
        {CONSENT_NOTICE}
      </p>

      <div
        onDragOver={(e) => {
          if (!configured) return;
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (configured) add(e.dataTransfer.files);
        }}
        className={cn("rounded-xl border-2 border-dashed p-3 sm:p-4", dragging ? "border-royal bg-soft" : "border-midnight/20")}
      >
        <button
          type="button"
          disabled={!configured}
          onClick={() => inputRef.current?.click()}
          aria-describedby={`${baseId}-hint`}
          className="flex min-h-11 w-full flex-col items-center justify-center gap-1 rounded-lg px-3 py-3 text-center text-sm text-midnight hover:text-royal disabled:opacity-60"
        >
          <span className="font-semibold">Choose photos</span>
          <span className="text-midnight/70">or drag and drop several here</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          tabIndex={-1}
          aria-label="Choose photos to upload"
          className="sr-only"
          onChange={(e) => add(e.target.files)}
        />
        <p id={`${baseId}-hint`} className="mt-1 text-center text-xs text-midnight/70">
          {configured ? hint : IMAGE_MESSAGES.notConfigured}
        </p>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {total > 0 ? `${doneCount} of ${total} uploaded` : ""}
      </p>

      {total > 0 ? (
        <div className="space-y-2">
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.key} className="rounded-lg bg-white p-3 ring-1 ring-midnight/10">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-midnight">{item.file.name}</span>
                  <StatusChip label={STATE_LABEL[item.state].text} tone={STATE_LABEL[item.state].tone} />
                  {item.state === "failed" ? (
                    <button type="button" onClick={() => retry(item.key)} className={button}>
                      Retry<span className="sr-only"> {item.file.name}</span>
                    </button>
                  ) : null}
                </div>
                {item.state === "uploading" ? (
                  <div
                    role="progressbar"
                    aria-label={`Uploading ${item.file.name}`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={item.percent}
                    className="mt-2 h-2 w-full overflow-hidden rounded-full bg-soft"
                  >
                    <div className="h-full bg-royal" style={{ width: `${item.percent}%` }} />
                  </div>
                ) : null}
                {item.state === "failed" && item.error ? <p className="mt-1 text-sm text-danger">{item.error}</p> : null}
              </li>
            ))}
          </ul>
          {doneCount > 0 ? (
            <button type="button" onClick={clearFinished} className={button}>
              Clear finished
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
