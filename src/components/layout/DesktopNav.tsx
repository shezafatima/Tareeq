import { navItems } from "@/lib/site";
import NavLink from "./NavLink";

export default function DesktopNav() {
  return (
    <nav aria-label="Main" className="hidden md:block">
      <ul className="flex items-center gap-8">
        {navItems.map((item) => (
          <li key={item.href}>
            <NavLink
              href={item.href}
              className="inline-flex min-h-11 items-center text-base font-medium text-midnight transition-colors hover:text-sky aria-[current=page]:underline aria-[current=page]:decoration-saffron aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-8"
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
