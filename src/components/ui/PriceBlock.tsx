import type { PriceDisplay } from "@/lib/pricing/rules";

type PriceBlockProps = {
  price: PriceDisplay;
  /** sm: cards and panels · md: mobile bars · lg: booking cards */
  size?: "sm" | "md" | "lg";
  /** a small caption above the price ("Price"), as the booking card and mobile bar always had */
  label?: string;
  /** "midnight" for light surfaces; "inherit" lets a coloured surface (a dark program panel) set the text colour */
  tone?: "midnight" | "inherit";
  /** keep the price on one line with an ellipsis (the mobile bar, where space is tight) */
  truncate?: boolean;
  className?: string;
};

const VALUE_SIZE = { sm: "text-base", md: "text-base leading-tight", lg: "text-2xl" } as const;
const LABEL_SIZE = { sm: "text-sm", md: "text-xs", lg: "text-sm" } as const;

/**
 * The one price display for programs and courses (specs/034-pricing-certificate-announcement FR-007, research R5).
 * Presentational only (no hooks, no server code), so the admin previews render this same component.
 * `none` draws nothing; `text` is the older price text, drawn as it always was.
 */
export default function PriceBlock({ price, size = "sm", label, tone = "midnight", truncate = false, className = "" }: PriceBlockProps) {
  if (price.kind === "none") return null;
  const color = tone === "midnight" ? "text-midnight" : "";
  const value = `font-heading font-bold ${VALUE_SIZE[size]}${truncate ? " truncate" : ""}`;

  let body: React.ReactNode;
  if (price.kind === "contact") body = <p className={value}>Contact us for pricing</p>;
  else if (price.kind === "free") body = <p className={value}>Free</p>;
  else if (price.kind === "text") body = <p className={value}>{price.text}</p>;
  else {
    body = (
      <>
        <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          {price.original && (
            <del className="text-sm font-normal line-through opacity-80">
              <span className="sr-only">Original price </span>
              {price.original}
            </del>
          )}
          <span className={value}>
            {price.original && <span className="sr-only">, now </span>}
            {price.current}
          </span>
          {price.unit && <span className="text-sm font-normal opacity-80">{price.unit}</span>}
        </p>
        {price.offerLabel && (
          <p className="mt-1.5">
            <span className="inline-block rounded-pill bg-saffron px-2.5 py-0.5 text-xs font-semibold text-midnight">{price.offerLabel}</span>
          </p>
        )}
        {price.offerEnds && <p className="mt-1 text-xs opacity-80">{price.offerEnds}</p>}
      </>
    );
  }

  return (
    <div className={`${color} ${className}`.trim()}>
      {label && <p className={`${LABEL_SIZE[size]} opacity-80`}>{label}</p>}
      {body}
    </div>
  );
}
