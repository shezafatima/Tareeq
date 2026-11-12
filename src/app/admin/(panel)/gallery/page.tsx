import { Images, Plus } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import EmptyState from "@/components/admin/EmptyState";
import GalleryAlbumAdminCard from "@/components/admin/GalleryAlbumAdminCard";
import UnavailableNotice from "@/components/admin/UnavailableNotice";
import { listAllAlbums } from "@/lib/admin/gallery-read";
import { safeLoad } from "@/lib/admin/safe-load";
import { requireAdmin } from "@/lib/admin/session";

export const metadata = { title: "Gallery" };

const newButton =
  "inline-flex min-h-11 items-center gap-2 rounded-full bg-midnight px-5 text-sm font-semibold text-white hover:bg-royal";

export default async function GalleryAdminPage() {
  await requireAdmin();
  const loaded = await safeLoad(listAllAlbums);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold text-midnight">Gallery</h1>
        {loaded.ok ? (
          <Link href="/admin/gallery/new" className={newButton}>
            <Plus weight="bold" size={16} aria-hidden="true" />
            New album
          </Link>
        ) : null}
      </div>
      {!loaded.ok ? (
        <UnavailableNotice />
      ) : loaded.data.length === 0 ? (
        <EmptyState icon={Images} title="No albums yet.">
          Create an album for a workshop, then upload its photos.
        </EmptyState>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {loaded.data.map((album) => (
            <li key={album.id}>
              <GalleryAlbumAdminCard album={album} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
