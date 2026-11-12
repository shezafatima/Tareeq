import SafeImage from "@/components/ui/SafeImage";

export type AuthorPhoto = { src: string; width: number; height: number; alt: string; fallbackSrc?: string };

/** The fixed author of every post: Sheza Fatima, with the founder photo from the site images (specs/033-admin-blog FR-005). */
export default function AuthorLine({ photo, children }: { photo: AuthorPhoto; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <SafeImage
        src={photo.src}
        fallbackSrc={photo.fallbackSrc}
        alt={photo.alt}
        width={photo.width}
        height={photo.height}
        sizes="40px"
        className="size-10 shrink-0 rounded-full object-cover"
      />
      <div className="min-w-0 text-sm text-midnight/80">
        <p className="font-semibold text-midnight">Sheza Fatima</p>
        {children ? <p>{children}</p> : null}
      </div>
    </div>
  );
}
