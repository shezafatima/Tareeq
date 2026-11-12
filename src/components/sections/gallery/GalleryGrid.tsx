import SafeImage from "@/components/ui/SafeImage";
import type { PublicPhoto } from "@/lib/gallery/view";

/**
 * The photos of one album as a masonry grid (CSS columns, so every photo keeps its proportions). Each photo is a button the
 * lightbox listens for through data-photo-index. DOM order is album order, so keyboard order and viewer order match.
 */
export default function GalleryGrid({ photos }: { photos: PublicPhoto[] }) {
  return (
    <ul className="columns-2 gap-3 sm:columns-3 lg:columns-4">
      {photos.map((photo, i) => (
        <li key={photo.id} className="mb-3 break-inside-avoid">
          <button
            type="button"
            data-photo-index={i}
            aria-label={`Open photo ${i + 1} of ${photos.length}: ${photo.alt}`}
            className="block w-full overflow-hidden rounded-lg bg-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal"
          >
            <SafeImage
              src={photo.src}
              alt={photo.alt}
              width={photo.width}
              height={photo.height}
              priority={i < 2}
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="block h-auto w-full"
            />
          </button>
        </li>
      ))}
    </ul>
  );
}
