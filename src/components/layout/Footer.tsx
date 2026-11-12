import { InstagramLogo, LinkedinLogo, TiktokLogo, XLogo, YoutubeLogo } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import Container from "@/components/ui/Container";
import Reveal from "@/components/ui/Reveal";
import { getCourseFormLabel, getFooterContact } from "@/content";
import { getSiteSettings } from "@/lib/settings/data";
import type { SocialKind } from "@/lib/settings/merge";
import { footerContactHref, tagline, type NavItem } from "@/lib/site";
import Logo from "./Logo";

const link =
  "inline-flex min-h-11 items-center text-white/80 transition-colors duration-[var(--dur-fast)] hover:text-white hover:underline hover:underline-offset-4";
const heading = "text-sm font-semibold uppercase tracking-[0.18em] text-white/70";

const SOCIAL_ICONS = { youtube: YoutubeLogo, linkedin: LinkedinLogo, instagram: InstagramLogo, tiktok: TiktokLogo, x: XLogo } satisfies Record<SocialKind, unknown>;

// The only place for contact details, read from the site settings (specs/028-site-settings). An entry renders only when
// it is set; nothing is invented.
export default async function Footer({ items }: { items: NavItem[] }) {
  const [{ items: contactItems, socials }, courseFormLabel] = await Promise.all([
    getSiteSettings().then(getFooterContact),
    getCourseFormLabel(),
  ]);
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
            {items.map((item) => (
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

        {(contactItems.length > 0 || socials.length > 0) && (
          <section aria-labelledby="footer-contact-title" id={footerContactHref.slice(1)}>
            <h2 id="footer-contact-title" className={heading}>
              Contact
            </h2>
            {/* one column from 768px to 1023px, where the footer's third column is too narrow for two */}
            <ul className="mt-1 grid gap-x-6 sm:grid-cols-2 md:max-lg:grid-cols-1">
              {contactItems.map((item) => (
                <li key={item.kind} id={item.kind === "email" ? "footer-email" : undefined} className="py-1 text-white/80">
                  <span className="block text-sm text-white/70">{item.label}</span>
                  {item.href ? (
                    <a
                      href={item.href}
                      {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className={`${link} [overflow-wrap:anywhere]`}
                    >
                      {item.value}
                      {item.external && <span className="sr-only"> (opens in a new tab)</span>}
                    </a>
                  ) : (
                    <span className="block whitespace-pre-line py-2 [overflow-wrap:anywhere]">{item.value}</span>
                  )}
                </li>
              ))}
            </ul>
            {socials.length > 0 && (
              <ul aria-label="Tareeq on social media" className="mt-1 flex flex-wrap gap-1">
                {socials.map(({ kind, label, href }) => {
                  const SocialIcon = SOCIAL_ICONS[kind];
                  return (
                    <li key={kind}>
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${label} (opens in a new tab)`}
                        className="inline-flex size-11 items-center justify-center rounded-pill text-white/80 transition-colors duration-[var(--dur-fast)] hover:bg-white/10 hover:text-white"
                      >
                        <SocialIcon aria-hidden="true" size={24} />
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        <p className="border-t border-white/15 pt-3 text-sm text-white/70 md:col-span-3">
          © {new Date().getFullYear()} Tareeq. All rights reserved.
        </p>
      </Container>
      </Reveal>
    </footer>
  );
}
