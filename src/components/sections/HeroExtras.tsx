import Container from "@/components/ui/Container";
import { Icon } from "@/components/ui/icons";
import Reveal from "@/components/ui/Reveal";
import { getTrustFacts } from "@/content";

/**
 * Directly after the hero, never inside it: a slim scroll cue that sits over the bottom edge of the first screen
 * (desktop), and a small strip of plain facts. The hero itself is not touched.
 */
export default async function HeroExtras() {
  const facts = await getTrustFacts();

  return (
    <div className="relative">
      <a
        href="#how-it-works"
        aria-label="Scroll to the next section"
        className="absolute left-1/2 top-0 z-10 hidden size-11 -translate-x-1/2 -translate-y-[calc(100%+1.25rem)] items-center justify-center rounded-pill bg-white/80 text-royal ring-1 ring-royal/15 backdrop-blur-sm transition-colors duration-[var(--dur-fast)] hover:bg-white lg:flex"
      >
        <span className="cue block">
          <Icon name="chevronDown" className="h-5 w-5" />
        </span>
      </a>
      {facts.length > 0 && (
        <Container className="py-5 lg:py-3">
          <Reveal>
            <ul
              aria-label="At a glance"
              className="mx-auto flex w-fit max-w-full flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-card bg-white px-6 py-3 text-sm font-medium text-midnight/80 shadow-card-rest ring-1 ring-royal/10 sm:rounded-pill sm:text-base"
            >
              {facts.map((f, i) => (
                <li key={f.id} className="flex items-center gap-5">
                  {i > 0 && <span aria-hidden="true" className="hidden h-1.5 w-1.5 rounded-full bg-saffron sm:block" />}
                  {f.text}
                </li>
              ))}
            </ul>
          </Reveal>
        </Container>
      )}
    </div>
  );
}
