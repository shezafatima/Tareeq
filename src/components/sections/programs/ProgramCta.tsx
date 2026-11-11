import Button from "@/components/ui/Button";
import ChevronRight from "@/components/ui/ChevronRight";
import type { Program } from "@/lib/programs/options";
import { resolveProgramCta } from "@/lib/programs/view";
import type { ContactDetails } from "@/lib/settings/merge";
import { contactFallbackHref, whatsappUrl } from "@/lib/site";

type ProgramCtaProps = {
  program: Program;
  /** from the site settings, passed down by a Server Component (specs/028-site-settings) */
  contact: ContactDetails;
  /** with no WhatsApp number, link to the footer's email instead of drawing nothing */
  contactFallback?: boolean;
  variant?: "primary" | "secondary";
  className?: string;
};

/** A program's call to action, following its type. See specs/015-programs-pages/contracts/routes.md. */
export default function ProgramCta({ program, contact, contactFallback, variant, className }: ProgramCtaProps) {
  const { whatsappNumber, email } = contact;
  const cta =
    resolveProgramCta(program, (message) => whatsappUrl(whatsappNumber, message)) ??
    (contactFallback ? { label: email ? "Email us" : "Contact us", href: contactFallbackHref(email), external: false } : null);
  if (!cta) return null;

  return (
    <Button href={cta.href} external={cta.external} variant={variant} className={className}>
      {cta.label}
      <span className="sr-only">: {program.title}</span>
      <ChevronRight />
    </Button>
  );
}
