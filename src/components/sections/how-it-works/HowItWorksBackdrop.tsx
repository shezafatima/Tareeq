import { DotGrid, Sparkle, WavyLine } from "@/components/sections/SaffronAccents";

const LINE = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

/** A light bulb, for the Learn step. */
function Bulb({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 64 64" className={className} {...LINE}>
      <path d="M32 10a17 17 0 0 0-10 30.7c2 1.5 3 3.5 3 5.3h14c0-1.800 1-3.800 3-5.300A17 17 0 0 0 32 10z" />
      <path d="M26 52h12M28 58h8" />
      <path d="M32 2v2M8 26H6M58 26h-2M13 8l2 2M51 8l-2 2" />
    </svg>
  );
}

/** A speech bubble with a typing line and the brand chevron, for the Prompt step. */
function PromptBubble({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 72 60" className={className} {...LINE}>
      <path d="M10 4h52a6 6 0 0 1 6 6v28a6 6 0 0 1-6 6H28L14 56V44h-4a6 6 0 0 1-6-6V10a6 6 0 0 1 6-6z" />
      <path d="M16 18h28M16 30h18" />
      <path d="m52 17 7 7-7 7" />
    </svg>
  );
}

/** A simple page being laid out, for the Build step. */
function PageSketch({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 72 60" className={className} {...LINE}>
      <rect x="4" y="4" width="64" height="52" rx="6" />
      <path d="M4 16h64" />
      <rect x="12" y="24" width="22" height="24" rx="3" />
      <path d="M42 26h18M42 36h18M42 46h10" />
    </svg>
  );
}

/** The chest chevron from the robot, repeated as in the preloader. */
function Chevrons({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 64 20" className={className} {...LINE} strokeWidth={3}>
      <path d="m4 3 7 7-7 7M20 3l7 7-7 7M36 3l7 7-7 7M52 3l7 7-7 7" />
    </svg>
  );
}

/**
 * Decoration behind "How it works": line drawings of the three steps and the site's saffron vectors. Static inline
 * SVG, so nothing to load and nothing moving. Hidden from assistive technology. Below 1024px only the corner pieces
 * stay, so they never compete with the tablet.
 */
export default function HowItWorksBackdrop() {
  return (
    <div aria-hidden="true" className="hiw-backdrop">
      <span className="hiw-blob hiw-blob-a" />
      <span className="hiw-blob hiw-blob-b" />
      <Bulb className="hiw-art hiw-art-bulb" />
      <PromptBubble className="hiw-art hiw-art-bubble" />
      <PageSketch className="hiw-art hiw-art-page" />
      <Sparkle className="hiw-art hiw-art-sparkle-a" />
      <Sparkle className="hiw-art hiw-art-sparkle-b" />
      <DotGrid className="hiw-art hiw-art-dots-a" />
      <DotGrid className="hiw-art hiw-art-dots-b" />
      <WavyLine className="hiw-art hiw-art-wave" />
      <Chevrons className="hiw-art hiw-art-chevrons" />
    </div>
  );
}
