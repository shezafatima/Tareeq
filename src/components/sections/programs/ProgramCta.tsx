import Button from "@/components/ui/Button";
import ChevronRight from "@/components/ui/ChevronRight";
import type { Program } from "@/lib/programs/options";
import { resolveProgramCta } from "@/lib/programs/view";
import { getContactEmail, getContactFallbackHref, getWhatsAppUrlWithMessage } from "@/lib/site";

type ProgramCtaProps = {
  program: Program;
  /** with no WhatsApp number, link to the footer's email instead of drawing nothing */
  contactFallback?: boolean;
  variant?: "primary" | "secondary";
  className?: string;
};

/** A program's call to action, following its type. See specs/015-programs-pages/contracts/routes.md. */
export default function ProgramCta({ program, contactFallback, variant, className }: ProgramCtaProps) {
  const cta =
    resolveProgramCta(program, getWhatsAppUrlWithMessage) ??
    (contactFallback
      ? { label: getContactEmail() ? "Email us" : "Contact us", href: getContactFallbackHref(), external: false }
      : null);
  if (!cta) return null;

  return (
    <Button href={cta.href} external={cta.external} variant={variant} className={className}>
      {cta.label}
      <span className="sr-only">: {program.title}</span>
      <ChevronRight />
    </Button>
  );
}
