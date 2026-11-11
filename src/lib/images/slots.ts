// The editable site images (specs/030-image-upload, approved slot list). Code-owned: the list, labels, recommended sizes and
// the default files shipped in /public live here. Add a slot by adding an entry; nothing else needs a schema change.
// Pure: relative imports only.

export type SiteImageSlot = {
  label: string;
  help: string;
  recommended: string;
  defaultSrc: string;
  defaultWidth: number;
  defaultHeight: number;
  defaultAlt: string;
};

export const SITE_IMAGE_SLOTS = {
  founderPhoto: {
    label: "Founder photo",
    help: "Shown in the Meet your mentor section on the home page.",
    recommended: "1122 x 1402 px, portrait (4:5)",
    defaultSrc: "/founder.jpeg",
    defaultWidth: 1122,
    defaultHeight: 1402,
    defaultAlt: "Sheza Fatima, founder of Tareeq",
  },
} as const satisfies Record<string, SiteImageSlot>;

export type SlotKey = keyof typeof SITE_IMAGE_SLOTS;
export const SLOT_KEYS = Object.keys(SITE_IMAGE_SLOTS) as SlotKey[];
export const isSlotKey = (key: string): key is SlotKey => Object.prototype.hasOwnProperty.call(SITE_IMAGE_SLOTS, key);
