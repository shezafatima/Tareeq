import { Images, PencilSimple } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { deleteGalleryAlbum, setGalleryAlbumPublished } from "@/lib/admin/gallery-actions";
import type { AdminAlbumCard } from "@/lib/admin/gallery-read";
import { optimizedUrl } from "@/lib/images/shared";
import GalleryDeleteButton from "./GalleryDeleteButton";
import PublishedToggle from "./PublishedToggle";

/** One album in the admin grid: cover, title, date, photo count, instant published switch, an open link and delete. */
export default function GalleryAlbumAdminCard({ album }: { album: AdminAlbumCard }) {
  const count = `${album.photoCount} ${album.photoCount === 1 ? "photo" : "photos"}`;
  const deleteBody =
    album.photoCount > 0
      ? `Delete this album and its ${count}? They will be removed from the site. This can't be undone.`
      : "Delete this album? This can't be undone.";
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-soft shadow-sm ring-1 ring-midnight/10">
      <div className="relative aspect-[4/3] w-full bg-midnight/10">
        {album.cover ? (
          // a plain img: a small Cloudinary thumbnail in a fixed box, as in the image uploader
          // eslint-disable-next-line @next/next/no-img-element
          <img src={optimizedUrl(album.cover.src, 640)} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
        ) : (
          <span className="absolute inset-0 grid place-items-center text-midnight/60">
            <Images size={40} weight="duotone" aria-hidden="true" />
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h2 className="font-heading text-base font-bold text-midnight">
          <Link href={`/admin/gallery/${album.id}`} className="hover:text-royal hover:underline">
            {album.title}
          </Link>
        </h2>
        <p className="text-sm text-midnight/80">{album.dateText}</p>
        <p className="text-xs font-semibold text-midnight/80">{count}</p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
          <PublishedToggle id={album.id} title={album.title} published={album.published} action={setGalleryAlbumPublished} />
          <div className="flex flex-wrap items-center gap-1">
            <Link
              href={`/admin/gallery/${album.id}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-midnight/70 bg-white px-4 text-sm font-semibold text-midnight hover:bg-midnight/5"
            >
              <PencilSimple weight="duotone" size={18} aria-hidden="true" />
              Open
              <span className="sr-only"> {album.title}</span>
            </Link>
            <GalleryDeleteButton
              action={deleteGalleryAlbum}
              id={album.id}
              label="Delete"
              title="Delete this album?"
              body={deleteBody}
              successMessage="Album deleted"
            />
          </div>
        </div>
      </div>
    </article>
  );
}
