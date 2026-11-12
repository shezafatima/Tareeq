import Button from "@/components/ui/Button";
import ChevronRight from "@/components/ui/ChevronRight";
import Container from "@/components/ui/Container";
import SafeImage from "@/components/ui/SafeImage";
import { getLatestPhotosSafe } from "@/lib/gallery/data";

const COUNT = 6;

/** The newest public photos on /workshop with a link to the whole gallery. Renders nothing when there are none (specs/032-admin-gallery FR-022). */
export default async function WorkshopGallery() {
  const photos = await getLatestPhotosSafe(COUNT);
  if (photos.length === 0) return null;

  return (
    <Container as="section" className="pb-section">
      <h2 id="workshop-gallery-heading" className="font-heading text-2xl font-bold text-midnight lg:text-3xl">
        From our workshops
      </h2>
      <ul aria-labelledby="workshop-gallery-heading" className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((photo) => (
          <li key={photo.id} className="relative aspect-square overflow-hidden rounded-lg bg-soft">
            <SafeImage src={photo.src} alt={photo.alt} fill sizes="(min-width: 640px) 33vw, 50vw" className="object-cover" />
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <Button href="/gallery">
          See all photos
          <ChevronRight />
        </Button>
      </div>
    </Container>
  );
}
