"use client"; // needs open state, key and pointer handling, focus trap and the body scroll lock

import { CaretLeft, CaretRight, X } from "@phosphor-icons/react/dist/ssr";
import { useCallback, useEffect, useRef, useState } from "react";
import SafeImage from "@/components/ui/SafeImage";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import type { PublicPhoto } from "@/lib/gallery/view";

// The in-house photo viewer (specs/032-admin-gallery research R11). It wraps the server-rendered grid as `children` and listens for
// clicks on [data-photo-index], so the grid stays server markup. Arrows and swipe move without wrapping; Escape and the close button
// close it; focus stays inside and returns to the photo that opened it. The only motion is a fade, off for reduced motion.

const SWIPE_PX = 50;
const iconButton =
  "grid size-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-30 disabled:hover:bg-white/10";

export default function GalleryLightbox({ photos, children }: { photos: PublicPhoto[]; children: React.ReactNode }) {
  const [index, setIndex] = useState<number | null>(null);
  const [shown, setShown] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const open = index !== null;
  const last = photos.length - 1;

  const close = useCallback(() => setIndex(null), []);
  const move = useCallback((step: number) => setIndex((i) => (i === null ? i : Math.min(last, Math.max(0, i + step)))), [last]);

  useFocusTrap(panelRef, open, () => openerRef.current);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => setShown(true));
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") move(-1);
      else if (e.key === "ArrowRight") move(1);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.cancelAnimationFrame(frame);
      setShown(false); // ready to fade in again next time
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close, move]);

  const onGridClick = (e: React.MouseEvent) => {
    const button = (e.target as Element).closest<HTMLElement>("[data-photo-index]");
    if (!button) return;
    const at = Number(button.dataset.photoIndex);
    if (!Number.isInteger(at) || at < 0 || at > last) return;
    openerRef.current = button;
    setIndex(at);
  };

  const photo = index === null ? null : photos[index];

  return (
    <>
      <div onClick={onGridClick}>{children}</div>
      {photo && index !== null ? (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={`Photo ${index + 1} of ${photos.length}`}
          className={`fixed inset-0 z-50 flex flex-col bg-midnight/95 text-white transition-opacity duration-200 motion-reduce:transition-none ${shown ? "opacity-100" : "opacity-0"}`}
        >
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <p className="text-sm font-semibold" aria-hidden="true">
              {index + 1} of {photos.length}
            </p>
            <button type="button" onClick={close} aria-label="Close" className={iconButton}>
              <X size={22} weight="bold" aria-hidden="true" />
            </button>
          </div>

          <div
            className="relative flex min-h-0 flex-1 touch-pan-y items-center justify-center px-2 sm:px-16"
            onPointerDown={(e) => {
              if (e.pointerType !== "mouse") start.current = { x: e.clientX, y: e.clientY };
            }}
            onPointerUp={(e) => {
              const from = start.current;
              start.current = null;
              if (!from) return;
              const dx = e.clientX - from.x;
              const dy = e.clientY - from.y;
              // mostly vertical movement is the page scrolling, not a swipe
              if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1);
            }}
            onPointerCancel={() => {
              start.current = null;
            }}
          >
            <button
              type="button"
              onClick={() => move(-1)}
              disabled={index === 0}
              aria-label="Previous photo"
              className={`${iconButton} absolute left-2 top-1/2 z-10 -translate-y-1/2 max-sm:bottom-2 max-sm:top-auto max-sm:translate-y-0`}
            >
              <CaretLeft size={22} weight="bold" aria-hidden="true" />
            </button>
            <SafeImage
              key={photo.id}
              src={photo.src}
              alt={photo.alt}
              width={photo.width}
              height={photo.height}
              priority
              sizes="100vw"
              className="h-auto max-h-[72svh] w-auto max-w-full select-none object-contain"
            />
            <button
              type="button"
              onClick={() => move(1)}
              disabled={index === last}
              aria-label="Next photo"
              className={`${iconButton} absolute right-2 top-1/2 z-10 -translate-y-1/2 max-sm:bottom-2 max-sm:top-auto max-sm:translate-y-0`}
            >
              <CaretRight size={22} weight="bold" aria-hidden="true" />
            </button>
          </div>

          <p aria-live="polite" className="min-h-14 px-16 pb-4 pt-3 text-center text-sm text-white/90 sm:px-24">
            {photo.caption ?? ""}
          </p>
        </div>
      ) : null}
    </>
  );
}
