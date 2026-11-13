import PriceBlock from "@/components/ui/PriceBlock";
import { resolvePrice } from "@/lib/pricing/rules";
import type { Program } from "@/lib/programs/options";
import { visibleFacts } from "@/lib/programs/view";
import type { ContactDetails } from "@/lib/settings/merge";
import ProgramCta from "./ProgramCta";
import ProgramFacts from "./ProgramFacts";

/** Price, facts and call to action, staying in view beside the body on desktop. Phones get MobileCtaBar instead. */
export default function BookingCard({ program, contact }: { program: Program; contact: ContactDetails }) {
  return (
    <aside aria-label="Book this program" className="program-booking-card rounded-card bg-white p-6 shadow-card-raised">
      <PriceBlock price={resolvePrice(program.pricing, program.priceText)} size="lg" label="Price" />
      <ProgramFacts facts={visibleFacts(program)} variant="list" className="mt-5 border-t border-royal/10 pt-5" />
      <div className="mt-6">
        <ProgramCta program={program} contact={contact} contactFallback className="w-full" />
      </div>
    </aside>
  );
}
