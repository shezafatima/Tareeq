import Button from "@/components/ui/Button";
import ChevronRight from "@/components/ui/ChevronRight";
import Container from "@/components/ui/Container";
import Reveal from "@/components/ui/Reveal";

type CtaBandProps = {
  line: string;
  label: string;
  href: string;
  /** opens in a new tab (for example WhatsApp) */
  external?: boolean;
};

/** A line and one button on a Midnight band. Used for the home page's final call to action and at the end of inner pages. */
export default function CtaBand({ line, label, href, external }: CtaBandProps) {
  return (
    <section aria-label="Next step" className="relative overflow-hidden bg-midnight text-white">
      {/* the logo's chevron motif, faint and static */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute -right-6 top-1/2 h-48 w-72 -translate-y-1/2 text-white/[0.06] sm:w-96 lg:w-[34rem]"
        viewBox="0 0 120 40"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 4l14 16L6 36M30 4l14 16-14 16M54 4l14 16-14 16M78 4l14 16-14 16M102 4l14 16-14 16" />
      </svg>
      <Container className="relative flex flex-col items-start gap-6 py-section lg:flex-row lg:items-center lg:justify-between lg:py-16">
        <Reveal>
          <p className="max-w-xl font-heading text-2xl font-bold leading-tight sm:text-3xl">{line}</p>
        </Reveal>
        <Reveal index={1}>
          {external ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex min-h-11 items-center justify-center gap-2 rounded-pill bg-white px-7 py-3.5 text-base font-semibold text-midnight transition-[background-color,transform] duration-[var(--dur-fast)] ease-[var(--ease-soft)] hover:bg-soft active:scale-[0.98] focus-visible:outline-saffron"
            >
              {label}
              <ChevronRight />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : (
            <Button href={href} size="lg" className="bg-white text-midnight hover:bg-soft focus-visible:outline-saffron">
              {label}
              <ChevronRight />
            </Button>
          )}
        </Reveal>
      </Container>
    </section>
  );
}
