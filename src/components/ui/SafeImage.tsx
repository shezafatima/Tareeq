"use client"; // needs an onError handler and state to swap in the fallback file

import Image from "next/image";
import { useState } from "react";
import { optimizedUrl } from "@/lib/images/shared";

type SafeImageProps = {
  src: string;
  /** a file shipped in /public, shown if `src` fails to load. Omit it for decorative images that should just disappear. */
  fallbackSrc?: string;
  fallbackWidth?: number;
  fallbackHeight?: number;
  fallbackAlt?: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes: string;
  priority?: boolean;
  className?: string;
};

/**
 * next/image with the Cloudinary auto format and quality, and a guaranteed fallback: if the image fails to load it is swapped once
 * for `fallbackSrc`, or hidden when there is none, so a broken image icon never shows (specs/030-image-upload FR-014).
 */
export default function SafeImage({ src, fallbackSrc, fallbackWidth, fallbackHeight, fallbackAlt, alt, width, height, fill, sizes, priority, className }: SafeImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = failedSrc === src;
  if (failed && !fallbackSrc) return null;
  const useFallback = failed && fallbackSrc;
  const shownSrc = useFallback ? (fallbackSrc as string) : optimizedUrl(src);
  const common = {
    src: shownSrc,
    alt: useFallback ? (fallbackAlt ?? alt) : alt,
    sizes,
    priority,
    className,
    onError: () => setFailedSrc(src),
  };
  if (fill) return <Image {...common} alt={common.alt} fill />;
  return <Image {...common} alt={common.alt} width={useFallback ? (fallbackWidth ?? width) : width} height={useFallback ? (fallbackHeight ?? height) : height} />;
}
