import Link from "next/link";
import SafeImage from "@/components/ui/SafeImage";
import type { PublicAlbumCard } from "@/lib/gallery/view";

/** One album on /gallery: cover, title, date and photo count. The whole card is one link, named by the title. */
export default function GalleryAlbumCard({ album, priority }: { album: PublicAlbumCard; priority?: boolean }) {
  const count = `${album.photoCount} ${album.photoCount === 1 ? "photo" : "photos"}`;
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-midnight/10 focus-within:ring-2 focus-within:ring-royal">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-soft">
        <SafeImage
          src={album.cover.src}
          alt={album.cover.alt}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h2 className="font-heading text-lg font-bold text-midnight">
          <Link href={`/gallery/${album.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {album.title}
          </Link>
        </h2>
        <p className="text-sm text-midnight/80">{album.dateText}</p>
        <p className="text-sm font-semibold text-royal">{count}</p>
      </div>
    </article>
  );
}
