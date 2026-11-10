"use client"; // needs the current path to place the sliding active indicator

import { BookOpen, Tray } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin", label: "Submissions", Icon: Tray, isActive: (p: string) => p === "/admin" },
  { href: "/admin/programs", label: "Programs", Icon: BookOpen, isActive: (p: string) => p.startsWith("/admin/programs") },
];

const ROW = 48; // item height (h-11 = 44px) plus the 4px gap, in px: how far the indicator moves per item

/** The two page links with a saffron bar that slides (transform only) to the current page. */
export default function AdminNav() {
  const pathname = usePathname();
  const active = ITEMS.findIndex((i) => i.isActive(pathname));

  return (
    <nav aria-label="Admin" className="relative flex flex-col gap-1">
      {active >= 0 ? (
        <span
          aria-hidden="true"
          className="absolute left-0 top-0 h-11 w-1 rounded-full bg-saffron transition-transform duration-200 ease-[var(--ease-soft)]"
          style={{ transform: `translateY(${active * ROW}px)` }}
        />
      ) : null}
      {ITEMS.map(({ href, label, Icon }, i) => (
        <Link
          key={href}
          href={href}
          aria-current={i === active ? "page" : undefined}
          className={`flex h-11 items-center gap-3 rounded-xl pl-4 pr-3 text-sm font-semibold transition-colors ${
            i === active ? "bg-white/10 text-white" : "text-white/85 hover:bg-white/10 hover:text-white"
          }`}
        >
          <Icon weight="duotone" size={22} aria-hidden="true" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
