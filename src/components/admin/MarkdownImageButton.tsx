"use client"; // needs a file input, an XHR upload with progress, and a dialog with focus handling

import { Image as ImageIcon } from "@phosphor-icons/react";
import { useId, useRef, useState, type RefObject } from "react";
import { signUpload } from "@/lib/admin/images-actions";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { IMAGE_LIMITS, IMAGE_MESSAGES, optimizedUrl, validateFile } from "@/lib/images/shared";
import { uploadToCloudinary, type UploadedAsset } from "@/lib/images/upload-client";
import { TOOLBAR_BUTTON, type EditorApi } from "./MarkdownEditor";
import { useToast } from "./Toast";

const ACCEPT = "image/jpeg,image/png,image/webp";

type Pending = { asset: UploadedAsset; at: { start: number; end: number } };

/**
 * The toolbar's image button (specs/033-admin-blog FR-011, User Story 2). The file goes through the same signed upload as every other
 * image; the owner is then asked to describe it, and `![alt](address)` is inserted where the cursor was when the button was pressed.
 * Cancelling at the alt-text step inserts nothing. The uploaded file stays in the image store: removing it is out of scope here.
 */
export default function MarkdownImageButton({
  editorRef,
  onUploaded,
}: {
  editorRef: RefObject<EditorApi | null>;
  /** told the size of every image added, so the live preview can render it with next/image straight away */
  onUploaded: (image: { url: string; width: number; height: number }) => void;
}) {
  const toast = useToast();
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const cursor = useRef({ start: 0, end: 0 });
  const [percent, setPercent] = useState<number | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [alt, setAlt] = useState("");
  const [altError, setAltError] = useState("");

  useFocusTrap(dialogRef, pending !== null);

  const open = () => {
    // the cursor is read now: the file chooser and the dialog take focus away from the text
    cursor.current = editorRef.current?.selection() ?? { start: 0, end: 0 };
    inputRef.current?.click();
  };

  const start = async (file: File) => {
    const problem = validateFile(file);
    if (problem) return toast.error(problem);
    setPercent(0);
    try {
      const signed = await signUpload({ scope: "blog" });
      if (!signed.ok) {
        toast.error(
          signed.code === "unauthorized"
            ? "Your session has ended. Please sign in again."
            : signed.code === "not_configured"
              ? IMAGE_MESSAGES.notConfigured
              : IMAGE_MESSAGES.uploadFailed,
        );
        return;
      }
      const asset = await uploadToCloudinary(file, signed.upload, { onProgress: setPercent });
      setAlt("");
      setAltError("");
      setPending({ asset, at: cursor.current });
    } catch {
      toast.error(IMAGE_MESSAGES.uploadFailed);
    } finally {
      setPercent(null);
    }
  };

  const close = () => {
    setPending(null);
    setAlt("");
    setAltError("");
  };

  const insert = () => {
    if (!pending) return;
    const text = alt.replace(/[\[\]\r\n]+/g, " ").replace(/\s+/g, " ").trim();
    if (!text) return setAltError(IMAGE_MESSAGES.alt);
    if (text.length > IMAGE_LIMITS.maxAlt) return setAltError(IMAGE_MESSAGES.alt);
    const { asset, at } = pending;
    onUploaded({ url: asset.url, width: asset.width, height: asset.height });
    editorRef.current?.insert(`![${text}](${asset.url})`, at, { block: true });
    close();
  };

  const uploading = percent !== null;

  return (
    <>
      <button
        type="button"
        data-toolbar-item=""
        aria-label="Image"
        title={uploading ? `Uploading ${percent}%` : "Image"}
        aria-busy={uploading}
        disabled={uploading}
        onClick={open}
        className={TOOLBAR_BUTTON}
      >
        <ImageIcon size={20} aria-hidden="true" />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        tabIndex={-1}
        className="sr-only"
        aria-hidden="true"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void start(file);
          e.target.value = "";
        }}
      />
      {uploading ? (
        <span role="status" className="px-2 text-xs font-semibold text-midnight/80">
          Uploading {percent}%
        </span>
      ) : null}

      {pending ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-midnight/60 p-4 sm:items-center">
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.stopPropagation();
                close();
              }
            }}
            className="w-full max-w-md rounded-card bg-white p-5 shadow-float"
          >
            <h2 id={titleId} className="font-heading text-lg font-bold text-midnight">
              Describe this image
            </h2>
            {/* a plain img: a Cloudinary file just uploaded, shown at its natural proportions */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={optimizedUrl(pending.asset.url, 480)} alt="" className="mt-3 max-h-48 w-full rounded-control bg-soft object-contain" />
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                insert();
              }}
              className="mt-4"
            >
              <label htmlFor={`${titleId}-alt`} className="block text-sm font-semibold text-midnight">
                Alt text
              </label>
              <input
                id={`${titleId}-alt`}
                type="text"
                value={alt}
                maxLength={IMAGE_LIMITS.maxAlt}
                aria-invalid={altError ? true : undefined}
                aria-describedby={`${titleId}-help${altError ? ` ${titleId}-error` : ""}`}
                onChange={(e) => {
                  setAlt(e.target.value);
                  if (altError) setAltError("");
                }}
                className="mt-1.5 block min-h-11 w-full rounded-control border border-midnight/60 bg-white px-4 text-base text-midnight"
              />
              <p id={`${titleId}-help`} className="mt-1.5 text-sm text-midnight/70">
                Say what the picture shows, for readers who cannot see it. Up to {IMAGE_LIMITS.maxAlt} characters.
              </p>
              {altError ? (
                <p id={`${titleId}-error`} className="mt-1 text-xs font-medium text-danger">
                  {altError}
                </p>
              ) : null}
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={alt.trim() === ""}
                  className="min-h-11 rounded-full bg-midnight px-6 text-sm font-semibold text-white hover:bg-royal disabled:opacity-60"
                >
                  Insert image
                </button>
                <button type="button" onClick={close} className="min-h-11 rounded-full px-4 text-sm font-semibold text-midnight underline underline-offset-4">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
