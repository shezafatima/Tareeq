import SafeImage from "@/components/ui/SafeImage";
import type { EffectiveImage } from "@/lib/site-images/merge";

/**
 * The founder photo in a 4:5 rounded box (the default file is already 4:5; face, laptop, mug and table stay in frame), kept
 * small on phones, with a soft brand glow behind it. The photo comes from the editable site images (specs/030-image-upload);
 * if it fails to load, the shipped file is shown instead. Server component around one tiny client image. The glow is
 * decorative and drifts in CSS (`.mentor-glow` in globals.css).
 */
export default function MentorPhoto({ photo }: { photo: EffectiveImage }) {
  return (
    <div className="relative isolate mx-auto w-full max-w-[13rem] sm:max-w-xs lg:max-w-none">
      <div aria-hidden="true" className="mentor-glow" />
      <div className="relative aspect-[4/5] overflow-hidden rounded-card bg-soft">
        <SafeImage
          src={photo.src}
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          fallbackSrc={photo.fallbackSrc}
          fallbackWidth={1122}
          fallbackHeight={1402}
          fallbackAlt="Sheza Fatima, founder of Tareeq"
          sizes="(min-width: 1024px) 40vw, (min-width: 640px) 320px, 208px"
          className="size-full object-cover object-center"
        />
      </div>
    </div>
  );
}
