"use client"; // needs state, file and drag events, and an XHR upload for real progress

import { useEffect, useId, useRef, useState } from "react";
import { signUpload } from "@/lib/admin/images-actions";
import { uploadToCloudinary } from "@/lib/images/upload-client";
import { IMAGE_MESSAGES, optimizedUrl, validateFile, IMAGE_LIMITS, type StoredImage } from "@/lib/images/shared";
import type { UploadScope } from "@/lib/cloudinary/server";
import { cn } from "@/lib/utils";

// The one image uploader (specs/030-image-upload contracts/routes-and-ui.md). The file goes straight to Cloudinary with a signature
// from signUpload; this component never sees the API secret. The parent form holds the value and saves it.

type Props = {
  label: string;
  scope: UploadScope;
  value: StoredImage | null;
  onChange: (next: StoredImage | null) => void;
  /** error for the alt text field (shown once there is an image) or for the zone (when there is none) */
  error?: string;
  /** an old plain URL on a record, shown as the current image until it is replaced or removed */
  legacyUrl?: string;
  onClearLegacy?: () => void;
  recommended?: string;
  /** shown instead of the empty state, e.g. the default file of a site image slot */
  defaultPreview?: { src: string; note: string };
  id?: string;
  disabled?: boolean;
};

type Phase = { kind: "idle" } | { kind: "uploading"; percent: number; name: string } | { kind: "error"; message: string };

const ACCEPT = "image/jpeg,image/png,image/webp";
const button =
  "inline-flex min-h-11 items-center justify-center rounded-full border border-midnight/20 px-5 text-sm font-semibold text-midnight hover:border-royal hover:text-royal disabled:opacity-60";

export default function ImageUploader({ label, scope, value, onChange, error, legacyUrl, onClearLegacy, recommended, defaultPreview, id, disabled }: Props) {
  const autoId = useId();
  const baseId = id ?? `image-${autoId.replace(/:/g, "")}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const zoneRef = useRef<HTMLButtonElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [dragging, setDragging] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => () => { if (localPreview) URL.revokeObjectURL(localPreview); }, [localPreview]);

  const uploading = phase.kind === "uploading";
  const hasImage = Boolean(value) || Boolean(legacyUrl);
  const previewSrc = localPreview ?? (value ? optimizedUrl(value.url, 640) : legacyUrl || defaultPreview?.src || "");

  const fail = (message: string) => setPhase({ kind: "error", message });

  const start = async (file: File) => {
    const problem = validateFile(file);
    if (problem) return fail(problem);
    setPhase({ kind: "uploading", percent: 0, name: file.name });
    setLocalPreview(URL.createObjectURL(file));

    const signed = await signUpload({ scope });
    if (!signed.ok) {
      setLocalPreview(null);
      if (signed.code === "unauthorized") return fail("Your session has ended. Please sign in again.");
      return fail(signed.code === "not_configured" ? IMAGE_MESSAGES.notConfigured : IMAGE_MESSAGES.uploadFailed);
    }
    const { upload } = signed;
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const asset = await uploadToCloudinary(file, upload, {
        signal: controller.signal,
        onProgress: (percent) => setPhase({ kind: "uploading", percent, name: file.name }),
      });
      onChange({ url: asset.url, publicId: asset.publicId, width: asset.width, height: asset.height, alt: value?.alt ?? "" });
      onClearLegacy?.();
      setLocalPreview(null);
      setPhase({ kind: "idle" });
    } catch (err) {
      setLocalPreview(null);
      if (err instanceof DOMException && err.name === "AbortError") setPhase({ kind: "idle" });
      else fail(IMAGE_MESSAGES.uploadFailed);
    } finally {
      abortRef.current = null;
    }
  };

  const pick = (files: FileList | null) => {
    const file = files?.[0];
    if (file) void start(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  const remove = () => {
    onChange(null);
    onClearLegacy?.();
    setPhase({ kind: "idle" });
    window.requestAnimationFrame(() => zoneRef.current?.focus());
  };

  const cancel = () => abortRef.current?.abort();

  const zoneError = phase.kind === "error" ? phase.message : !value && !legacyUrl ? error : undefined;
  const altError = value ? error : undefined;
  const altId = `${baseId}-alt`;
  const zoneErrorId = `${baseId}-error`;

  return (
    <div className="min-w-0 space-y-3">
      <div id={`${baseId}-label`} className="text-sm font-semibold text-midnight">
        {label}
      </div>

      {(hasImage || uploading || defaultPreview) && previewSrc && (
        <div className="relative max-w-sm overflow-hidden rounded-xl border border-midnight/10 bg-soft">
          {/* a plain img: the source is a local blob, a Cloudinary URL or a legacy URL, shown at its natural proportions */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewSrc} alt={value?.alt || ""} className="block max-h-72 w-full object-contain" />
          {!hasImage && !uploading && defaultPreview && (
            <span className="absolute left-2 top-2 rounded-full bg-midnight px-2.5 py-1 text-xs font-semibold text-white">{defaultPreview.note}</span>
          )}
        </div>
      )}

      {uploading ? (
        <div className="space-y-2" role="status">
          <div
            role="progressbar"
            aria-label={`Uploading ${phase.name}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={phase.percent}
            className="h-2 w-full max-w-sm overflow-hidden rounded-full bg-soft"
          >
            <div className="h-full bg-royal" style={{ width: `${phase.percent}%` }} />
          </div>
          <p className="text-sm text-midnight/70">Uploading {phase.percent}%</p>
          <button type="button" onClick={cancel} className={button}>
            Cancel upload
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            if (disabled) return;
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (!disabled) pick(e.dataTransfer.files);
          }}
          className={cn(
            "rounded-xl border-2 border-dashed p-3 sm:p-4",
            dragging ? "border-royal bg-soft" : zoneError ? "border-red-600" : "border-midnight/20",
          )}
        >
          <button
            ref={zoneRef}
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            aria-describedby={zoneError ? zoneErrorId : `${baseId}-hint`}
            className="flex min-h-11 w-full flex-col items-center justify-center gap-1 rounded-lg px-3 py-3 text-center text-sm text-midnight hover:text-royal disabled:opacity-60"
          >
            <span className="font-semibold">{hasImage ? "Replace image" : "Choose an image"}</span>
            <span className="text-midnight/70">or drag and drop it here</span>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            tabIndex={-1}
            aria-labelledby={`${baseId}-label`}
            className="sr-only"
            onChange={(e) => pick(e.target.files)}
          />
          <p id={`${baseId}-hint`} className="mt-1 text-center text-xs text-midnight/60">
            JPG, PNG or WebP, up to {IMAGE_LIMITS.maxBytes / (1024 * 1024)} MB.{recommended ? ` Recommended: ${recommended}.` : ""}
          </p>
        </div>
      )}

      <p id={zoneErrorId} role={zoneError ? "alert" : undefined} className={cn("text-sm text-red-700", !zoneError && "hidden")}>
        {zoneError}
      </p>
      {phase.kind === "error" && (
        <button type="button" onClick={() => setPhase({ kind: "idle" })} className={button}>
          Dismiss
        </button>
      )}

      {value && !uploading && (
        <div className="space-y-1.5">
          <label htmlFor={altId} className="block text-sm font-semibold text-midnight">
            Image description (alt text) <span className="text-red-700">*</span>
          </label>
          <input
            id={altId}
            type="text"
            value={value.alt}
            maxLength={IMAGE_LIMITS.maxAlt}
            required
            aria-invalid={altError ? true : undefined}
            aria-describedby={`${altId}-help${altError ? ` ${altId}-error` : ""}`}
            onChange={(e) => onChange({ ...value, alt: e.target.value })}
            className={cn(
              "min-h-11 w-full rounded-lg border bg-white px-3 text-base text-midnight focus-visible:outline-2 focus-visible:outline-royal",
              altError ? "border-red-600" : "border-midnight/20",
            )}
          />
          <p id={`${altId}-help`} className="text-xs text-midnight/60">
            Said aloud by screen readers. Describe what the picture shows.
          </p>
          {altError && (
            <p id={`${altId}-error`} className="text-sm text-red-700">
              {altError}
            </p>
          )}
        </div>
      )}

      {hasImage && !uploading && (
        <button type="button" onClick={remove} disabled={disabled} className={button}>
          {defaultPreview ? "Use default image" : "Remove image"}
        </button>
      )}
    </div>
  );
}
