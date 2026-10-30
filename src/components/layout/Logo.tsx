import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Both files are cropped, transparent copies of public/logo.png (480x127).
const sources = {
  dark: "/logo-tareeq.png",
  light: "/logo-tareeq-light.png",
};

type LogoProps = {
  /** "dark" for light backgrounds, "light" for Midnight surfaces. */
  variant?: keyof typeof sources;
  /** Height class for the image; the width follows the aspect ratio. */
  className?: string;
};

export default function Logo({ variant = "dark", className = "h-6" }: LogoProps) {
  return (
    <Link href="/" aria-label="tareeq, home" className="flex min-h-11 items-center">
      <Image src={sources[variant]} alt="" width={480} height={127} className={cn("w-auto", className)} priority />
    </Link>
  );
}
