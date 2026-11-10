import { cn } from "@/lib/utils";

/** A pulsing placeholder block shown while admin data loads. Decorative, so hidden from assistive technology. */
export default function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("admin-skeleton rounded-xl bg-midnight/10", className)} />;
}
