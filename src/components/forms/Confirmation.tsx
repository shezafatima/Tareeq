"use client";

import { useEffect, useRef } from "react";
import Button from "@/components/ui/Button";

type ConfirmationProps = {
  heading: string;
  next: string;
  referenceLabel: string;
  reference: string;
  whatsappHref: string | null;
  whatsappLabel: string;
};

// Shown in place of the form after a successful submit. The heading takes focus so keyboard and
// screen-reader users know it worked.
export default function Confirmation({ heading, next, referenceLabel, reference, whatsappHref, whatsappLabel }: ConfirmationProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div>
      <h2 ref={headingRef} tabIndex={-1} className="font-heading text-2xl font-bold text-midnight sm:text-3xl">
        {heading}
      </h2>
      <p className="mt-3 text-lg text-midnight/85">{next}</p>
      <p className="mt-4 text-base text-midnight/80">
        {referenceLabel} <strong className="font-semibold text-midnight">{reference}</strong>
      </p>
      {whatsappHref && (
        <Button href={whatsappHref} external size="lg" className="mt-6">
          {whatsappLabel}
        </Button>
      )}
    </div>
  );
}
