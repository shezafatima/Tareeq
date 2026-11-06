"use client"; // Next.js requires error boundaries to be client components

import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import { footerContactHref } from "@/lib/site";

/** Shown when a page cannot be drawn at all, for example the database is down and no good copy exists yet. */
export default function SiteError({ reset }: { error: Error; reset: () => void }) {
  return (
    <Container className="py-section lg:py-20">
      <h1 className="font-heading text-3xl font-bold text-midnight lg:text-5xl">Something went wrong on our side</h1>
      <p className="mt-4 max-w-2xl text-lg text-midnight/85">
        This page didn&apos;t load. Please try again, or get in touch and we&apos;ll help you directly.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button href={footerContactHref} variant="secondary">
          Contact us
        </Button>
      </div>
    </Container>
  );
}
