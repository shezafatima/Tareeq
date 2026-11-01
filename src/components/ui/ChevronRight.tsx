export default function ChevronRight({ className = "h-3 w-1.5" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 12 20" className={className} fill="none">
      <path d="M2 2l8 8-8 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
