import { Heart, Quotes, Sparkle } from "@phosphor-icons/react/dist/ssr";
import type { CSSProperties } from "react";

/**
 * The founder's note of the day, in its own card (specs/029-admin-dashboard US5, FR-025). A warmer card than the
 * rest: a soft saffron glow, a heart that gently beats, a big faint quote mark and a few sparkles, all drawn from the
 * brand palette. Text stays midnight on a light surface for AA contrast; saffron is used only for shapes, never for text.
 * The heart's beat moves only transform and stops under reduced motion. Needs no data, so it shows even when the
 * numbers cannot load.
 */
export default function FounderNote({ quote, name, className }: { quote: string; name: string; className?: string }) {
  return (
    <section
      aria-label="Founder's note"
      style={{ "--i": 1 } as CSSProperties}
      className={`dash-rise relative overflow-hidden rounded-2xl bg-linear-to-br from-saffron/20 via-white to-soft flex items-center px-4 py-3 shadow-card-rest ring-1 ring-saffron/30 sm:px-5 ${className ?? ""}`}
    >
      <Quotes aria-hidden="true" weight="fill" size={72} className="pointer-events-none absolute -right-1 -top-3 text-royal/10" />
      <Sparkle aria-hidden="true" weight="fill" size={14} className="pointer-events-none absolute right-16 top-3 text-saffron" />
      <Sparkle aria-hidden="true" weight="fill" size={10} className="pointer-events-none absolute bottom-3 right-6 text-saffron/80" />
      <div className="relative flex w-full items-center gap-3">
        <span aria-hidden="true" className="dash-heart grid size-10 shrink-0 place-items-center rounded-full bg-white text-saffron shadow-sm ring-1 ring-saffron/40">
          <Heart weight="fill" size={20} />
        </span>
        <figure className="min-w-0 sm:pr-10">
          <figcaption className="text-xs font-semibold uppercase tracking-wide text-royal">Just for you, {name}</figcaption>
          <blockquote className="mt-1 max-w-3xl font-heading text-base font-semibold leading-snug text-midnight sm:text-lg">
            &ldquo;{quote}&rdquo;
          </blockquote>
        </figure>
      </div>
    </section>
  );
}
