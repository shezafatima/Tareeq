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
              className="relative inline-flex min-h-11 items-center text-base font-medium text-midnight transition-colors duration-[var(--dur-fast)] hover:text-sky after:absolute after:inset-x-0 after:bottom-1.5 after:h-0.5 after:origin-left after:scale-x-0 after:bg-saffron after:transition-transform after:duration-[var(--dur-fast)] after:ease-[var(--ease-soft)] hover:after:scale-x-100 focus-visible:after:scale-x-100 aria-[current=page]:after:scale-x-100 motion-reduce:after:transition-none"
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
