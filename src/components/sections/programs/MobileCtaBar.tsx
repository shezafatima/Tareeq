import type { Program } from "@/lib/programs/options";
import ProgramCta from "./ProgramCta";

/**
 * The call to action, fixed to the bottom of the screen below the desktop width. CSS in globals.css keeps the page's
 * last content clear of it and lifts the floating WhatsApp button above it, so no JavaScript is needed.
 */
export default function MobileCtaBar({ program }: { program: Program }) {
  return (
    <div
      data-program-cta-bar=""
      className="program-cta-bar fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t border-midnight/10 bg-white px-gutter lg:hidden"
    >
      {program.priceText && (
        <div className="min-w-0">
          <p className="text-xs text-midnight/75">Price</p>
          <p className="font-heading font-bold leading-tight text-midnight">{program.priceText}</p>
        </div>
      )}
      <ProgramCta program={program} contactFallback className="ml-auto shrink-0" />
    </div>
  );
}
