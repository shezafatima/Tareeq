// Decorative saffron vectors for the "Why Tareeq" section (feature 008). Static, hidden from assistive technology,
// brand token colour only (currentColor = text-saffron), placed outside the text area by the caller.
export function Sparkle({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 1.5c.7 5.6 2.4 8.3 8 10.5-5.6 2.2-7.3 4.9-8 10.5-.7-5.6-2.4-8.3-8-10.5 5.6-2.2 7.3-4.9 8-10.5z" />
    </svg>
  );
}

export function DotGrid({ className }: { className?: string }) {
  const dots = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) dots.push(<circle key={`${r}-${c}`} cx={4 + c * 10} cy={4 + r * 10} r="1.8" />);
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 38 38" className={className} fill="currentColor">
      {dots}
    </svg>
  );
}

export function WavyLine({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 80 12" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M2 6c6-6 10-6 16 0s10 6 16 0 10-6 16 0 10 6 16 0 6-3 10-3" />
    </svg>
  );
}
