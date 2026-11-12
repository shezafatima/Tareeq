import type { Metadata } from "next";
import GalleryAlbumCard from "@/components/sections/gallery/GalleryAlbumCard";
import GalleryEmpty from "@/components/sections/gallery/GalleryEmpty";
import PageHeader from "@/components/sections/PageHeader";
import Container from "@/components/ui/Container";
import { loadPublishedAlbums } from "@/lib/gallery/data";

// Static, refreshed hourly and by the "gallery" tag (specs/032-admin-gallery).
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Gallery",
  description: "Photos from Tareeq workshops with teachers and students.",
  alternates: { canonical: "/gallery" },
};

export default async function GalleryPage() {
  const albums = (await loadPublishedAlbums()) ?? [];

  return (
    <>
      <PageHeader intro="Photos from our workshops with teachers and students.">Gallery</PageHeader>
      <Container className="pb-section">
        {albums.length === 0 ? (
          <GalleryEmpty />
        ) : (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {albums.map((album, i) => (
              <li key={album.slug}>
                <GalleryAlbumCard album={album} priority={i === 0} />
              </li>
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}
