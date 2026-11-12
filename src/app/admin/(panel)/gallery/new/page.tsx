import GalleryAlbumForm from "@/components/admin/GalleryAlbumForm";
import { requireAdmin } from "@/lib/admin/session";

export const metadata = { title: "New album" };

export default async function NewAlbumPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-midnight">New album</h1>
      <p className="max-w-2xl text-sm text-midnight/80">
        One album per event. After you create it you can upload photos. Nothing shows on the site until you publish the album and at
        least one photo.
      </p>
      <GalleryAlbumForm mode="create" initial={{ title: "", dateText: "", description: "", order: "0", published: false }} />
    </div>
  );
}
