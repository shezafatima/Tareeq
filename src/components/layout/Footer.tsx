import Link from "next/link";
import Container from "@/components/ui/Container";
import Reveal from "@/components/ui/Reveal";
import { getContactDetails, getCourseFormLabel } from "@/content";
import { navItems, socialLinks, tagline } from "@/lib/site";
import Logo from "./Logo";

const link =
  "inline-flex min-h-11 items-center text-white/80 md:min-h-6 transition-colors duration-[var(--dur-fast)] hover:text-white hover:underline hover:underline-offset-4";
const heading = "text-sm font-semibold uppercase tracking-[0.18em] text-white/70";

// Contact and social blocks render only when entries exist; nothing is invented.
export default async function Footer() {
  const [contactDetails, courseFormLabel] = await Promise.all([getContactDetails(), getCourseFormLabel()]);
  return (
    <footer className="overflow-clip bg-midnight text-white [&_a:focus-visible]:outline-saffron">
      <Reveal>
      <Container className="grid gap-4 pb-20 pt-6 md:grid-cols-[1.2fr_1fr_1fr] md:gap-x-8 md:gap-y-2 md:pb-16">
        <div>
          <Logo variant="light" className="h-6" />
          <p className="mt-2 max-w-xs text-base text-white/80">{tagline}</p>
        </div>

        <nav aria-label="Footer">
          <h2 className={heading}>Explore</h2>
          <ul className="mt-1 md:grid md:grid-cols-2 md:gap-x-6">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={link}>
                  {item.label}
                </Link>
              </li>
            ))}
            {/* the online course form: linked here and from course pages, never from the header */}
            <li>
              <Link href="/register" className={link}>
                {courseFormLabel}
              </Link>
            </li>
          </ul>
        </nav>

        {(contactDetails.length > 0 || socialLinks.length > 0) && (
          <div className="space-y-2">
            {contactDetails.length > 0 && (
              <section aria-labelledby="footer-contact">
                <h2 id="footer-contact" className={heading}>
                  Contact
                </h2>
                <ul className="mt-1">
                  {contactDetails.map((item) => (
                    <li key={item.label} className="py-1 text-white/80">
                      <span className="block text-sm text-white/70">{item.label}</span>
                      {item.href ? (
                        <a href={item.href} className={link}>
                          {item.value}
                        </a>
                      ) : (
                        <span className="inline-flex min-h-11 items-center md:min-h-6">{item.value}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {socialLinks.length > 0 && (
              <section aria-labelledby="footer-social">
                <h2 id="footer-social" className={heading}>
                  Follow us
                </h2>
                <ul className="mt-1">
                  {socialLinks.map((item) => (
                    <li key={item.href}>
                      <a href={item.href} target="_blank" rel="noopener noreferrer" className={link}>
                        {item.label}
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}

        <p className="border-t border-white/15 pt-3 text-sm text-white/70 md:col-span-3">
          © {new Date().getFullYear()} Tareeq. All rights reserved.
        </p>
      </Container>
      </Reveal>
    </footer>
  );
}
