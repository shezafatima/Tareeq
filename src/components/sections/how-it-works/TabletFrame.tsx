import Image from "next/image";

/**
 * The robot holding a tablet (public/tablet-screen.png, 612 x 408, transparent screen and background). Children sit
 * in the screen slot under the image, so the bezel and hands cover their edges. Plain markup with no hooks: it is
 * used inside the client stepper because the video layers need live refs. The image is decoration (alt="").
 */
export default function TabletFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="tablet">
      <div className="tablet-screen">{children}</div>
      <Image
        src="/tablet-screen.png"
        alt=""
        width={612}
        height={408}
        loading="lazy"
        sizes="(min-width: 1024px) 60vw, 100vw"
        className="tablet-frame"
      />
    </div>
  );
}
