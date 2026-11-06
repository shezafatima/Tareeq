import Image from "next/image";
import { isAllowedCover } from "@/lib/programs/view";
import { cn } from "@/lib/utils";

type ProgramCoverProps = {
  url?: string;
  /** what the image takes up at each width, for next/image */
  sizes: string;
  priority?: boolean;
  className?: string;
};

/** Decorative. The brand pattern always sits underneath, so it shows when there is no image or an image fails to load. */
export default function ProgramCover({ url, sizes, priority, className }: ProgramCoverProps) {
  return (
    <div aria-hidden="true" className={cn("program-pattern overflow-hidden", className)}>
      {isAllowedCover(url) && (
        <Image src={url} alt="" fill sizes={sizes} priority={priority} className="object-cover" />
      )}
    </div>
  );
}
