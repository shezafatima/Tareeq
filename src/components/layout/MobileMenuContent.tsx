import Button from "@/components/ui/Button";
import { joinHref, navItems } from "@/lib/site";
import Logo from "./Logo";
import NavLink from "./NavLink";

// Static content of the mobile menu. Rendered on the server and passed to MobileNav as children.
export default function MobileMenuContent() {
  return (
    <>
      <div className="flex h-16 shrink-0 items-center pl-gutter pr-14">
        <Logo className="h-5" />
      </div>

      <nav aria-label="Mobile" className="flex-1 px-gutter pt-4">
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => (
            <li key={item.href}>
              <NavLink
                href={item.href}
                className="flex min-h-11 items-center text-base font-medium text-royal transition-colors hover:text-sky aria-[current=page]:font-semibold aria-[current=page]:underline aria-[current=page]:decoration-saffron aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-8"
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="px-gutter pb-8 pt-6">
        <Button href={joinHref} className="w-full">
          Book a workshop
        </Button>
      </div>
    </>
  );
}
