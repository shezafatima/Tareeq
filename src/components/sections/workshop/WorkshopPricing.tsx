import Link from "next/link";
import Container from "@/components/ui/Container";
import PriceBlock from "@/components/ui/PriceBlock";
import type { WorkshopPriceEntry } from "@/lib/programs/workshop";

/**
 * Workshop prices (specs/034-pricing-certificate-announcement FR-010): the teachers and school-students programs, each
 * labelled with its title and linking to its page. Renders nothing when no program has pricing.
 */
export default function WorkshopPricing({ entries }: { entries: WorkshopPriceEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <section aria-labelledby="workshop-prices" className="pb-section">
      <Container>
        <h2 id="workshop-prices" className="font-heading text-2xl font-bold text-midnight">
          Workshop prices
        </h2>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2">
          {entries.map((entry) => (
            <li key={entry.slug} className="rounded-card bg-white p-5 shadow-card-raised">
              <Link
                href={`/programs/${entry.slug}`}
                className="inline-flex min-h-11 items-center font-heading text-lg font-semibold text-midnight underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal"
              >
                {entry.title}
              </Link>
              <PriceBlock price={entry.price} size="md" className="mt-1" />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
