import Button from "@/components/ui/Button";
import ChevronRight from "@/components/ui/ChevronRight";
import type { HomeProgramCard as HomeProgramCardData } from "@/content";
import { cn } from "@/lib/utils";

type HomeProgramCardProps = {
  card: HomeProgramCardData;
  /** resolved by the section: an internal path, a WhatsApp link, or null (no call to action is drawn) */
  ctaHref: string | null;
  featured?: boolean;
};

type Variant = "featured" | "active" | "quiet";

// Presentation only: how each variant looks. Colours are existing tokens; see contracts/program-card.md.
const surface: Record<Variant, string> = {
  featured: "bg-midnight text-white p-6 sm:p-8 lg:p-10",
  active: "text-midnight p-6",
  quiet: "bg-white/60 text-midnight/85 p-6",
};
const chip: Record<Variant, string> = {
  featured: "bg-white/10 text-white ring-white/30",
  active: "bg-white text-midnight ring-royal/25",
  quiet: "bg-soft text-midnight/85 ring-royal/15",
};
const dot: Record<Variant, string> = {
  featured: "bg-saffron",
  active: "bg-royal",
  quiet: "border border-midnight/50",
};

/**
 * One program on the home page. Server component. Only the call to action is a link; the card is not.
 * Same structure in every variant: chip, title, audience, facts, call to action.
 */
export default function HomeProgramCard({ card, ctaHref, featured = false }: HomeProgramCardProps) {
  const variant: Variant = featured ? "featured" : card.status === "coming-soon" ? "quiet" : "active";
  const facts = card.facts.filter((f) => f.value);
  const external = card.cta.kind === "whatsapp";

  return (
    <article
      data-variant={variant}
      data-status={card.status}
      className={cn(
        "program-card lift group/card relative flex h-full flex-col overflow-hidden rounded-card",
        card.status === "register-interest" ? "bg-white" : variant === "active" && "bg-soft",
        surface[variant],
      )}
    >
      {featured && (
        <>
          <span aria-hidden="true" className="program-glow pointer-events-none absolute -left-1/4 -top-1/4 h-[130%] w-[130%]" />
          <span aria-hidden="true" className="absolute left-0 top-0 h-1.5 w-28 rounded-br-full bg-saffron" />
        </>
      )}
      <div className="relative flex flex-1 flex-col">
        <p
          className={cn(
            "inline-flex w-fit items-center gap-2 rounded-pill px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ring-1",
            chip[variant],
          )}
        >
          <span aria-hidden="true" className={cn("size-2 rounded-full", dot[variant])} />
          {card.statusLabel}
        </p>
        <h3
          className={cn(
            "mt-4 font-heading font-bold",
            featured ? "text-2xl sm:text-3xl lg:text-4xl" : "text-xl",
            variant === "featured" ? "text-white" : "text-midnight",
          )}
        >
          {card.title}
        </h3>
        <p className={cn("mt-1.5 text-base", featured ? "text-white/85" : variant === "quiet" ? "text-midnight/80" : "text-midnight/85")}>
          {card.audience}
        </p>
        {facts.length > 0 && (
          <dl className={cn("mt-5 grid gap-2.5 text-sm", featured && "lg:mt-8 lg:gap-4 lg:text-base")}>
            {facts.map((f) => (
              <div key={f.label} className="flex flex-col">
                <dt className={cn("text-xs font-semibold uppercase tracking-[0.1em]", featured ? "text-saffron" : "text-royal")}>
                  {f.label}
                </dt>
                <dd className={cn("mt-0.5", featured ? "text-white" : variant === "quiet" ? "text-midnight/85" : "text-midnight")}>
                  {f.value}
                </dd>
              </div>
            ))}
          </dl>
        )}
        {ctaHref && (
          <div className="mt-auto pt-6">
            <Button
              href={ctaHref}
              external={external}
              variant={variant === "active" ? "primary" : "secondary"}
              className={cn(
                variant === "featured" && "border-white/70 text-white hover:bg-white/10",
                variant === "quiet" && "border-midnight/60",
              )}
            >
              {card.cta.label}
              <span className="sr-only">: {card.title}</span>
              <ChevronRight slide="4" className={cn("h-3 w-1.5", featured && "text-saffron")} />
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}
