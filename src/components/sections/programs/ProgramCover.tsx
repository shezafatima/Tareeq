import SafeImage from "@/components/ui/SafeImage";
import type { ResolvedCover } from "@/lib/programs/view";
import { cn } from "@/lib/utils";

type ProgramCoverProps = {
  cover: ResolvedCover | null;
  /** what the image takes up at each width, for next/image */
  sizes: string;
  priority?: boolean;
  className?: string;
};

/** Decorative. The brand pattern always sits underneath, so it shows when there is no image or an image fails to load (SafeImage hides a failed one). */
export default function ProgramCover({ cover, sizes, priority, className }: ProgramCoverProps) {
  return (
    <div aria-hidden="true" className={cn("program-pattern overflow-hidden", className)}>
      {cover && <SafeImage src={cover.src} alt="" fill sizes={sizes} priority={priority} className="object-cover" />}
    </div>
  );
}
