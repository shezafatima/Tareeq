import Image from "next/image";
import type { MentorContent } from "@/content";

/**
 * The founder photo in a 4:5 rounded box (the file is already 4:5; face, laptop, mug and table stay in frame), kept
 * small on phones, with a soft brand glow behind it. Server component. The glow is decorative and drifts in CSS
 * (`.mentor-glow` in globals.css).
 */
export default function MentorPhoto({ photo }: { photo: MentorContent["photo"] }) {
  return (
    <div className="relative isolate mx-auto w-full max-w-[13rem] sm:max-w-xs lg:max-w-none">
      <div aria-hidden="true" className="mentor-glow" />
      <div className="relative aspect-[4/5] overflow-hidden rounded-card bg-soft">
        <Image
          src={photo.src}
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          sizes="(min-width: 1024px) 40vw, (min-width: 640px) 320px, 208px"
          className="size-full object-cover object-center"
        />
      </div>
    </div>
  );
}
