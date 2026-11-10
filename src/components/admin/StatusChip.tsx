import { cn } from "@/lib/utils";

export type ChipTone = "saffron" | "sky" | "royal" | "grey";

// Text and background pairs chosen for AA contrast; the label is always shown, so colour is never the only signal.
const TONES: Record<ChipTone, string> = {
  saffron: "bg-saffron text-midnight",
  sky: "bg-soft text-royal ring-1 ring-sky/40",
  royal: "bg-royal text-white",
  grey: "bg-chip-grey-bg text-chip-grey-text",
};

export const LEAD_STATUS_LABEL = { new: "New", contacted: "Contacted", booked: "Booked", closed: "Closed" } as const;
export type LeadStatusKey = keyof typeof LEAD_STATUS_LABEL;
export const LEAD_STATUS_TONE: Record<LeadStatusKey, ChipTone> = {
  new: "saffron",
  contacted: "sky",
  booked: "royal",
  closed: "grey",
};

export default function StatusChip({ label, tone, className }: { label: string; tone: ChipTone; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold leading-none", TONES[tone], className)}>
      {label}
    </span>
  );
}
