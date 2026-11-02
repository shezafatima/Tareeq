"use client";
// Client: the hero's icons are motion components that animate from their `on` prop.

import { BulbIcon, CodeIcon, SparkleIcon } from "@/components/Hero";
import type { StepId } from "@/content";

const icons = { prompt: SparkleIcon, build: CodeIcon, learn: BulbIcon } as const;

export default function StepIcon({ id, on }: { id: StepId; on: boolean }) {
  const Icon = icons[id];
  return (
    <span aria-hidden="true" className="block h-4 w-4 shrink-0">
      <Icon on={on} />
    </span>
  );
}
