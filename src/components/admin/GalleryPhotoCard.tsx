import { deleteGalleryPhoto, setGalleryPhotoPublished } from "@/lib/admin/gallery-actions";
import type { AdminPhoto } from "@/lib/admin/gallery-read";
import { MESSAGES } from "@/lib/admin/gallery-schema";
import { optimizedUrl } from "@/lib/images/shared";
import GalleryDeleteButton from "./GalleryDeleteButton";
import PhotoCoverButton from "./PhotoCoverButton";
import PhotoDetailsForm from "./PhotoDetailsForm";
import PublishedToggle from "./PublishedToggle";
import StatusChip from "./StatusChip";

/** One photo in an album: thumbnail at its own proportions, cover and missing-alt badges, details form, published switch, cover and delete. */
export default function GalleryPhotoCard({ albumId, photo }: { albumId: string; photo: AdminPhoto }) {
  const { image } = photo;
  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-2xl bg-soft shadow-sm ring-1 ring-midnight/10">
      <div className="relative bg-midnight/10">
        {/* a plain img: a small Cloudinary thumbnail at its stored proportions, as in the image uploader */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={optimizedUrl(image.url, 640)}
          width={image.width}
          height={image.height}
          alt={image.alt}
          loading="lazy"
          className="block h-auto max-h-80 w-full object-contain"
        />
        <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
          {photo.isCover ? <StatusChip label="Cover" tone="royal" /> : null}
          {photo.missingAlt ? <StatusChip label="Missing alt text" tone="saffron" /> : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-3">
        <PhotoDetailsForm
          photoId={photo.id}
          published={photo.published}
          initial={{ alt: image.alt, caption: photo.caption ?? "", order: String(photo.order) }}
        />
        <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-midnight/10 pt-3">
          <PublishedToggle
            id={photo.id}
            title="photo"
            published={photo.published}
            action={setGalleryPhotoPublished}
            lockedReason={photo.missingAlt ? MESSAGES.altLocked : undefined}
          />
          {photo.isCover ? null : <PhotoCoverButton albumId={albumId} photoId={photo.id} />}
          <GalleryDeleteButton
            action={deleteGalleryPhoto}
            id={photo.id}
            label="Delete photo"
            title="Delete this photo?"
            body="It will be removed from the album and the site. This can't be undone."
            successMessage="Photo deleted"
          />
        </div>
      </div>
    </article>
  );
}
