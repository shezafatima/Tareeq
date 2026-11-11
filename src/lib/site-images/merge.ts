// The effective site images: a stored image over the slot's default file (specs/030-image-upload research R6, R7).
// Pure: relative imports only, so tests, the admin page and the data module share it.
import { SITE_IMAGE_SLOTS, SLOT_KEYS, type SlotKey } from "../images/slots.ts";
import type { StoredImage } from "../images/shared.ts";

export type StoredSiteImages = Partial<Record<SlotKey, StoredImage>>;

export type EffectiveImage = {
  src: string;
  width: number;
  height: number;
  alt: string;
  /** the shipped file in /public, used when the slot is empty */
  fallbackSrc: string;
  isDefault: boolean;
};
export type EffectiveSiteImages = Record<SlotKey, EffectiveImage>;

const usable = (i: StoredImage | undefined): i is StoredImage =>
  Boolean(i && typeof i.url === "string" && i.url.startsWith("https://") && i.width > 0 && i.height > 0);

export function mergeSiteImages(stored: StoredSiteImages | null | undefined): EffectiveSiteImages {
  const out = {} as EffectiveSiteImages;
  for (const key of SLOT_KEYS) {
    const slot = SITE_IMAGE_SLOTS[key];
    const mine = stored?.[key];
    out[key] = usable(mine)
      ? { src: mine.url, width: mine.width, height: mine.height, alt: mine.alt || slot.defaultAlt, fallbackSrc: slot.defaultSrc, isDefault: false }
      : { src: slot.defaultSrc, width: slot.defaultWidth, height: slot.defaultHeight, alt: slot.defaultAlt, fallbackSrc: slot.defaultSrc, isDefault: true };
  }
  return out;
}
