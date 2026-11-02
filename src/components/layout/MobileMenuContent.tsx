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
                className="relative flex min-h-11 w-fit items-center text-base font-medium text-royal transition-colors duration-[var(--dur-fast)] hover:text-sky after:absolute after:inset-x-0 after:bottom-1.5 after:h-0.5 after:origin-left after:scale-x-0 after:bg-saffron after:transition-transform after:duration-[var(--dur-fast)] after:ease-[var(--ease-soft)] hover:after:scale-x-100 focus-visible:after:scale-x-100 aria-[current=page]:font-semibold aria-[current=page]:after:scale-x-100 motion-reduce:after:transition-none"
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
