import type { Icon } from "@phosphor-icons/react";
import { Clock, ListBullets, MapPin, UsersThree } from "@phosphor-icons/react/dist/ssr";
import Button from "@/components/ui/Button";
import ChevronRight from "@/components/ui/ChevronRight";
import type { HomeProgramCard as HomeProgramCardData } from "@/content";

type HomeProgramCardProps = {
  card: HomeProgramCardData;
  /** resolved by the section: an internal path, a WhatsApp link, or null (no call to action is drawn) */
  ctaHref: string | null;
};

// The icon says what a fact is; its label stays in the HTML for screen readers.
const factIcons: Record<string, Icon> = { Format: MapPin, Duration: Clock, "Group size": UsersThree };

/**
 * One program on the home page. Server component. Only the call to action is a link; the card is not.
 * Every card looks the same: chip, title, audience, facts, call to action. Only the text differs.
 */
export default function HomeProgramCard({ card, ctaHref }: HomeProgramCardProps) {
  const facts = card.facts.filter((f) => f.value);

  return (
    <article
      data-status={card.status}
      className="program-card lift group/card relative flex h-full flex-col overflow-hidden rounded-card bg-white p-6 text-midnight"
    >
      <p className="inline-flex w-fit items-center gap-2 rounded-pill bg-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-midnight ring-1 ring-royal/15">
        <span aria-hidden="true" className="size-2 rounded-full bg-saffron" />
        {card.statusLabel}
      </p>
      {/* title + audience keep one height where they may wrap, so the facts line up across a row */}
      <div className="mt-4 md:max-lg:min-h-[5.125rem] lg:max-xl:min-h-[6.875rem]">
        <h3 className="font-heading text-xl font-bold text-midnight">{card.title}</h3>
        <p className="mt-1.5 text-base text-midnight/85">{card.audience}</p>
      </div>
      {facts.length > 0 && (
        <dl className="mt-4 grid gap-2.5 border-t border-royal/10 pt-4 text-sm">
          {facts.map((f) => {
            const FactIcon = factIcons[f.label] ?? ListBullets;
            return (
              <div key={f.label} className="flex items-start gap-2.5">
                <dt className="flex h-5 shrink-0 items-center">
                  <FactIcon aria-hidden="true" weight="duotone" className="size-[1.125rem] text-royal" />
                  <span className="sr-only">{f.label}</span>
                </dt>
                <dd className="min-w-0 leading-5 text-midnight">{f.value}</dd>
              </div>
            );
          })}
        </dl>
      )}
      {ctaHref && (
        <div className="mt-auto pt-6">
          <Button href={ctaHref} external={card.cta.kind === "whatsapp"}>
            {card.cta.label}
            <span className="sr-only">: {card.title}</span>
            <ChevronRight slide="4" className="h-3 w-1.5" />
          </Button>
        </div>
      )}
    </article>
  );
}
