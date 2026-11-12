import { notFound } from "next/navigation";
import Link from "next/link";
import GalleryAlbumForm from "@/components/admin/GalleryAlbumForm";
import GalleryDeleteButton from "@/components/admin/GalleryDeleteButton";
import GalleryPhotoCard from "@/components/admin/GalleryPhotoCard";
import GalleryUploader from "@/components/admin/GalleryUploader";
import UnavailableNotice from "@/components/admin/UnavailableNotice";
import { deleteGalleryAlbum } from "@/lib/admin/gallery-actions";
import { getAdminAlbum } from "@/lib/admin/gallery-read";
import { safeLoad } from "@/lib/admin/safe-load";
import { requireAdmin } from "@/lib/admin/session";
import { isConfigured } from "@/lib/cloudinary/server";

export const metadata = { title: "Album · Gallery" };

export default async function AlbumAdminPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const loaded = await safeLoad(() => getAdminAlbum(id));

  if (!loaded.ok) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading text-2xl font-bold text-midnight">Album</h1>
        <UnavailableNotice />
      </div>
    );
  }
  if (!loaded.data) notFound();
  const album = loaded.data;
  const count = `${album.photoCount} ${album.photoCount === 1 ? "photo" : "photos"}`;

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <Link href="/admin/gallery" className="text-sm font-semibold text-royal underline underline-offset-4">
          Back to albums
        </Link>
        <h1 className="font-heading text-2xl font-bold text-midnight">{album.title}</h1>
      </div>

      <section aria-labelledby="album-details" className="space-y-4">
        <h2 id="album-details" className="font-heading text-lg font-bold text-midnight">
          Album details
        </h2>
        <GalleryAlbumForm
          mode="edit"
          id={album.id}
          slug={album.slug}
          initial={{
            title: album.title,
            dateText: album.dateText,
            description: album.description ?? "",
            order: String(album.order),
            published: album.published,
          }}
        />
      </section>

      <section aria-labelledby="album-upload" className="space-y-4">
        <h2 id="album-upload" className="font-heading text-lg font-bold text-midnight">
          Upload photos
        </h2>
        <div className="max-w-2xl">
          <GalleryUploader albumId={album.id} configured={isConfigured()} />
        </div>
      </section>

      <section aria-labelledby="album-photos" className="space-y-4">
        <h2 id="album-photos" className="font-heading text-lg font-bold text-midnight">
          Photos ({album.photoCount})
        </h2>
        {album.photos.length === 0 ? (
          <p className="text-sm text-midnight/80">No photos yet. Drop some above.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {album.photos.map((photo) => (
              <li key={photo.id} className="min-w-0">
                <GalleryPhotoCard albumId={album.id} photo={photo} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="album-delete" className="space-y-3 border-t border-midnight/10 pt-6">
        <h2 id="album-delete" className="font-heading text-lg font-bold text-midnight">
          Delete album
        </h2>
        <GalleryDeleteButton
          action={deleteGalleryAlbum}
          id={album.id}
          label="Delete album"
          title="Delete this album?"
          body={
            album.photoCount > 0
              ? `Delete this album and its ${count}? They will be removed from the site. This can't be undone.`
              : "Delete this album? This can't be undone."
          }
          successMessage="Album deleted"
          redirectTo="/admin/gallery"
        />
      </section>
    </div>
  );
}
