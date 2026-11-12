import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import GalleryGrid from "@/components/sections/gallery/GalleryGrid";
import GalleryLightbox from "@/components/sections/gallery/GalleryLightbox";
import Container from "@/components/ui/Container";
import { getAlbumBySlug, getPublishedAlbumSlugs } from "@/lib/gallery/data";
import { optimizedUrl } from "@/lib/images/shared";

// Static, refreshed hourly and by the "gallery" tag (specs/032-admin-gallery).
export const revalidate = 3600;

type AlbumPageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getPublishedAlbumSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: AlbumPageProps): Promise<Metadata> {
  const { slug } = await params;
  const album = await getAlbumBySlug(slug);
  if (!album) return {};

  const description = album.description ?? `Photos from ${album.title}, ${album.dateText}.`;
  const image = { url: optimizedUrl(album.cover.src, 1200), width: album.cover.width, height: album.cover.height, alt: album.cover.alt };
  const path = `/gallery/${album.slug}`;

  return {
    title: album.title,
    description,
    alternates: { canonical: path },
    openGraph: { title: album.title, description, type: "website", siteName: "Tareeq", url: path, images: [image] },
    twitter: { card: "summary_large_image", title: album.title, description, images: [image.url] },
  };
}

export default async function AlbumPage({ params }: AlbumPageProps) {
  const { slug } = await params;
  const album = await getAlbumBySlug(slug);
  if (!album) notFound();

  return (
    <>
      <Container as="header" className="pb-8 pt-12 lg:pb-10 lg:pt-16">
        <Link href="/gallery" className="inline-flex min-h-11 items-center text-sm font-semibold text-royal underline underline-offset-4">
          Back to all albums
        </Link>
        <h1 className="mt-2 font-heading text-3xl font-bold text-midnight lg:text-5xl">{album.title}</h1>
        <p className="mt-2 text-base font-semibold text-midnight/80">{album.dateText}</p>
        {album.description ? <p className="mt-3 max-w-2xl text-lg text-midnight/85">{album.description}</p> : null}
      </Container>
      <Container className="pb-section">
        <GalleryLightbox photos={album.photos}>
          <GalleryGrid photos={album.photos} />
        </GalleryLightbox>
      </Container>
    </>
  );
}
