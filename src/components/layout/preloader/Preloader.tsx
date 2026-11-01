import Image from "next/image";
import ChevronProgress from "./ChevronProgress";
import PreloaderEyes from "./PreloaderEyes";
import { HEAD_IMG_H, HEAD_IMG_W } from "./visor";
import "./preloader.css";

// Fixed full-screen overlay. Hidden by default in CSS; shown when the inline script sets data-preloader="run".
// The head image is small (241 px wide), so it is shown at most 168 css px wide to stay reasonably sharp on 2x and 3x screens.
export default function Preloader() {
  return (
    <div
      id="preloader"
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[100] flex-col items-center justify-center bg-white"
    >
      <div data-part="head" className="relative w-[clamp(120px,36vw,168px)]" style={{ aspectRatio: `${HEAD_IMG_W} / ${HEAD_IMG_H}` }}>
        {/* eager, no preload link: it is fetched with the page without the high priority a preload would claim */}
        <Image src="/robot-head.png" alt="" width={HEAD_IMG_W} height={HEAD_IMG_H} loading="eager" className="h-full w-full" />
        <PreloaderEyes />
      </div>
      <div className="mt-5">
        <ChevronProgress />
      </div>
    </div>
  );
}
