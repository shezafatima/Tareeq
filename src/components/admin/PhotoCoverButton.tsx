"use client"; // needs a click handler, a pending state and a router refresh

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setGalleryAlbumCover } from "@/lib/admin/gallery-actions";
import { useToast } from "./Toast";
import { useActionFeedback } from "./useActionFeedback";

/** Makes this photo the cover of its album. */
export default function PhotoCoverButton({ albumId, photoId }: { albumId: string; photoId: string }) {
  const router = useRouter();
  const toast = useToast();
  const fail = useActionFeedback();
  const [pending, start] = useTransition();

  const click = () =>
    start(async () => {
      const result = await setGalleryAlbumCover({ albumId, photoId });
      if (result.ok) {
        toast.success("Cover updated");
        router.refresh();
      } else fail(result, "change the cover");
    });

  return (
    <button
      type="button"
      onClick={click}
      disabled={pending}
      aria-busy={pending}
      className="inline-flex min-h-11 items-center rounded-full border border-midnight/70 bg-white px-4 text-sm font-semibold text-midnight hover:bg-midnight/5 disabled:opacity-60"
    >
      Set as cover
    </button>
  );
}
