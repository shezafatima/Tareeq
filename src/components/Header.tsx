const links = ["Programs", "Courses", "About", "Contact"];

export default function Header() {
  return (
    <header className="sticky top-0 z-30 h-[var(--header-h)] border-b border-midnight/10 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <a href="#" aria-label="tareeq, home" className="flex items-center font-heading text-2xl font-extrabold lowercase tracking-tight text-midnight">
          tareeq
          <svg aria-hidden="true" viewBox="0 0 12 20" className="ml-1 h-4 w-2.5 translate-y-px" fill="none">
            <path d="M2 2l8 8-8 8" stroke="#F2A93B" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-8">
            {links.map((l) => (
              <li key={l}>
                <a href="#" className="text-base font-medium text-midnight transition-colors hover:text-sky">
                  {l}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <a href="#" className="inline-flex items-center gap-2 rounded-full bg-midnight px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-royal sm:px-5 sm:py-2.5">
          Join a workshop
          <svg aria-hidden="true" viewBox="0 0 12 20" className="h-3 w-1.5" fill="none">
            <path d="M2 2l8 8-8 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>
    </header>
  );
}
