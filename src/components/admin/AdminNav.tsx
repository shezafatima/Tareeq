"use client"; // needs the current path to place the sliding active indicator

import type { Icon } from "@phosphor-icons/react";
import { BookOpen, ChalkboardTeacher, GearSix, GraduationCap, Images, SquaresFour, Student, Tray, VideoCamera } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LeadType } from "@/lib/admin/leads-params";

type Badges = Record<LeadType, number> | null;

type LinkEntry = {
  kind: "link";
  href: string;
  label: string;
  Icon: Icon;
  isActive: (p: string) => boolean;
  /** shows this type's count of "new" records */
  badge?: LeadType;
  child?: boolean;
};
type Entry = { kind: "heading"; label: string; Icon: Icon } | LinkEntry;

const under = (base: string) => (p: string) => p === base || p.startsWith(`${base}/`);

// specs/026-split-submissions/contracts/routes-and-ui.md "Sidebar"
const ENTRIES: Entry[] = [
  // exact match: under("/admin") would also light up on every other admin page (specs/029-admin-dashboard research R11)
  { kind: "link", href: "/admin", label: "Dashboard", Icon: SquaresFour, isActive: (p) => p === "/admin" },
  { kind: "heading", label: "Submissions", Icon: Tray },
  { kind: "link", href: "/admin/submissions/workshops", label: "Workshops", Icon: ChalkboardTeacher, isActive: under("/admin/submissions/workshops"), badge: "workshop", child: true },
  { kind: "link", href: "/admin/submissions/courses", label: "Course registrations", Icon: Student, isActive: under("/admin/submissions/courses"), badge: "course", child: true },
  { kind: "link", href: "/admin/programs", label: "Programs", Icon: BookOpen, isActive: under("/admin/programs") },
  { kind: "link", href: "/admin/courses", label: "Courses", Icon: GraduationCap, isActive: under("/admin/courses") },
  { kind: "link", href: "/admin/testimonials", label: "Testimonials", Icon: VideoCamera, isActive: under("/admin/testimonials") },
  { kind: "link", href: "/admin/gallery", label: "Gallery", Icon: Images, isActive: under("/admin/gallery") },
  { kind: "link", href: "/admin/settings", label: "Settings", Icon: GearSix, isActive: under("/admin/settings") },
];

const HEADING = 32; // h-8
const LINK = 44; // h-11
const GAP = 4; // gap-1

// top of each entry in px, so the indicator can move with a transform even though the heading is shorter than a link
const TOPS = ENTRIES.reduce<number[]>((tops, entry, i) => {
  const prev = i === 0 ? 0 : tops[i - 1] + (ENTRIES[i - 1].kind === "heading" ? HEADING : LINK) + GAP;
  return [...tops, prev];
}, []);

/** The page links, with "Submissions" grouping its two views, and a saffron bar that slides (transform only) to the current page. */
export default function AdminNav({ badges }: { badges: Badges }) {
  const pathname = usePathname();
  const active = ENTRIES.findIndex((e) => e.kind === "link" && e.isActive(pathname));

  return (
    <nav aria-label="Admin" className="relative flex flex-col gap-1">
      {active >= 0 ? (
        <span
          aria-hidden="true"
          className="absolute left-0 top-0 h-11 w-1 rounded-full bg-saffron transition-transform duration-200 ease-[var(--ease-soft)] motion-reduce:transition-none"
          style={{ transform: `translateY(${TOPS[active]}px)` }}
        />
      ) : null}
      {ENTRIES.map((entry, i) => {
        if (entry.kind === "heading") {
          const { Icon } = entry;
          return (
            <p
              key={entry.label}
              className="flex h-8 items-center gap-3 pl-4 pr-3 text-xs font-semibold uppercase tracking-wide text-white/70"
            >
              <Icon weight="duotone" size={18} aria-hidden="true" />
              {entry.label}
            </p>
          );
        }
        const { href, label, Icon, badge, child } = entry;
        const count = badge && badges ? badges[badge] : 0;
        return (
          <Link
            key={href}
            href={href}
            aria-current={i === active ? "page" : undefined}
            className={`flex h-11 items-center gap-3 rounded-xl pr-3 text-sm font-semibold transition-colors ${child ? "pl-7" : "pl-4"} ${
              i === active ? "bg-white/10 text-white" : "text-white/85 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Icon weight="duotone" size={22} aria-hidden="true" />
            <span className="min-w-0 truncate">{label}</span>
            {count > 0 ? (
              <span className="ml-auto rounded-full bg-saffron px-2 py-0.5 text-xs font-semibold leading-none text-midnight">
                {count}
                <span className="sr-only"> new</span>
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
