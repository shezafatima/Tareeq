"use client";
// Client because it needs a click handler and state (poster -> iframe). No YouTube request happens before the click.
import { Play } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { useVideoGroup } from "@/components/sections/VideoGroup";

type Props = { id: string; videoId: string; name: string; placeholder?: boolean };

/** The video slot of a testimonial card (fills the 4:5 card; covers the caption while playing): poster + play button, replaced by a privacy-enhanced embed on click. */
export default function TestimonialVideo({ id, videoId, name, placeholder = false }: Props) {
  const { activeId, setActiveId } = useVideoGroup();
  const playing = !placeholder && activeId === id;

  return (
    <div className={`absolute inset-0 overflow-hidden bg-midnight ${playing ? "z-20" : "z-0"}`}>
      {playing ? (
        <iframe
          className="absolute inset-0 size-full border-0"
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0`}
          title={`${name} on Tareeq`}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      ) : placeholder ? (
        <>
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-royal to-midnight" />
          <button
            type="button"
            disabled
            aria-label="Placeholder video, not available"
            className="absolute inset-0 grid place-items-center pb-24 text-white/80"
          >
            <span className="grid size-14 place-items-center rounded-full bg-white/20">
              <Play size={26} weight="fill" aria-hidden="true" />
            </span>
          </button>
        </>
      ) : (
        <>
          <Image
            src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
            alt=""
            fill
            unoptimized
            sizes="(min-width: 768px) 300px, 72vw"
            className="object-cover"
          />
          <button
            type="button"
            onClick={() => setActiveId(id)}
            aria-label={`Play video from ${name}`}
            className="absolute inset-0 grid place-items-center bg-midnight/20 pb-24 text-white transition-colors hover:bg-midnight/30 focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-saffron"
          >
            <span className="grid size-16 place-items-center rounded-full bg-royal shadow-[var(--shadow-card-raised)]">
              <Play size={28} weight="fill" aria-hidden="true" />
            </span>
          </button>
          <a
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute right-2 top-2 rounded-full bg-midnight/70 px-3 py-2 text-xs font-medium text-white hover:bg-midnight focus-visible:outline-2 focus-visible:outline-saffron"
          >
            Open on YouTube<span className="sr-only"> (opens in a new tab)</span>
          </a>
        </>
      )}
    </div>
  );
}
