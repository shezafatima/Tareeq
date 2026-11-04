// Inline SVG icons in one style: 24px grid, 2px stroke, round caps and joins, currentColor.
// Decorative: always rendered inside an aria-hidden wrapper (IconTile) or given aria-hidden by the caller.

const paths = {
  teacher: (
    <>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </>
  ),
  student: (
    <>
      <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5z" />
      <path d="M9 7h6" />
    </>
  ),
  graduate: (
    <>
      <path d="M2 9l10-5 10 5-10 5-10-5z" />
      <path d="M6 11.5V16c0 1.4 2.7 3 6 3s6-1.6 6-3v-4.5" />
    </>
  ),
  team: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3 2.5-5 6-5s6 2 6 5" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M16.5 15c2.8 0 4.5 1.6 4.5 4.5" />
    </>
  ),
  tool: <path d="M14.7 6.3a4 4 0 0 0-5 5L3 18l3 3 6.7-6.7a4 4 0 0 0 5-5l-2.6 2.6-2.8-.7-.7-2.8 2.4-2.4z" />,
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l3 3 5-6" />
    </>
  ),
  whatsapp: <path d="M4 20l1.3-4A8 8 0 1 1 8 18.7L4 20z" />,
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  chevronDown: <path d="M6 9l6 6 6-6" />,
  // feature 008 ("Why Tareeq"): hands-on doing, skills and thinking, people, confidence
  hand: (
    <>
      <path d="M7 12V6.5a1.5 1.5 0 0 1 3 0V11" />
      <path d="M10 10.5V4.5a1.5 1.5 0 0 1 3 0V11" />
      <path d="M13 10.5V6a1.5 1.5 0 0 1 3 0v6" />
      <path d="M16 11.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-.8a6 6 0 0 1-4.7-2.3L4.2 14.4a1.6 1.6 0 0 1 2.4-2L8 14" />
    </>
  ),
  brain: (
    <>
      <path d="M9.5 3.5A3 3 0 0 0 6.7 5.6 3.2 3.2 0 0 0 4.5 8.7c0 1 .5 1.9 1.2 2.5A3.3 3.3 0 0 0 7 17.3a3 3 0 0 0 5 1.9V4.6a3 3 0 0 0-2.5-1.1z" />
      <path d="M14.5 3.5a3 3 0 0 1 2.8 2.1 3.2 3.2 0 0 1 2.2 3.1c0 1-.5 1.9-1.2 2.5a3.3 3.3 0 0 1-1.3 6.1 3 3 0 0 1-5 1.9" />
      <path d="M9 9.5h1.5M13.5 9.5H15M9.5 14H11M13 14h1.5" />
    </>
  ),
  users: (
    <>
      <circle cx="12" cy="8" r="3" />
      <path d="M6.5 20c0-3.2 2.4-5 5.5-5s5.5 1.8 5.5 5" />
      <circle cx="5" cy="9.5" r="2" />
      <path d="M1.5 18c0-2.3 1.6-3.7 3.7-3.7" />
      <circle cx="19" cy="9.5" r="2" />
      <path d="M22.5 18c0-2.3-1.6-3.7-3.7-3.7" />
    </>
  ),
  shieldCheck: (
    <>
      <path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.2-7.5 9.5-4.3-1.3-7.5-4.9-7.5-9.5V6L12 3z" />
      <path d="M8.8 12.2l2.2 2.2 4.2-4.4" />
    </>
  ),
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, className = "h-6 w-6" }: { name: IconName; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {paths[name]}
    </svg>
  );
}
