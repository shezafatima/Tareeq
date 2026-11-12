// Image rules shared by the uploader (instant feedback), the Server Actions (source of truth) and the unit tests
// (specs/030-image-upload). Pure: relative imports only, no server code.
import * as z from "zod/mini";

export const IMAGE_LIMITS = {
  maxBytes: 5 * 1024 * 1024,
  maxAlt: 200,
  /** extensions that agree with each allowed MIME type */
  extensions: { "image/jpeg": ["jpg", "jpeg"], "image/png": ["png"], "image/webp": ["webp"] } as Record<string, string[]>,
  /** Cloudinary format names accepted on upload and when verifying */
  formats: ["jpg", "png", "webp"] as readonly string[],
  folderRoot: "tareeq",
} as const;

export const IMAGE_MESSAGES = {
  type: "Use a JPG, PNG or WebP image.",
  size: "This image is over 5 MB. Choose a smaller one.",
  empty: "This file is empty. Choose another image.",
  alt: "Describe the image in a few words (up to 200 characters).",
  rejected: "This image could not be accepted. Upload it again.",
  notConfigured: "Uploads are not set up yet. Add the Cloudinary values to the environment.",
  uploadFailed: "The upload did not finish. Check your connection and try again.",
} as const;

export type StoredImage = { url: string; publicId: string; width: number; height: number; alt: string };

/** A message when the file breaks a rule, otherwise null. */
export function validateFile(file: { name: string; type: string; size: number }): string | null {
  if (file.size <= 0) return IMAGE_MESSAGES.empty;
  const exts = IMAGE_LIMITS.extensions[file.type];
  if (!exts) return IMAGE_MESSAGES.type;
  const ext = file.name.includes(".") ? (file.name.split(".").pop() ?? "").toLowerCase() : "";
  if (!exts.includes(ext)) return IMAGE_MESSAGES.type;
  if (file.size > IMAGE_LIMITS.maxBytes) return IMAGE_MESSAGES.size;
  return null;
}

export const imageSchema = z.object({
  url: z.string().check(z.trim(), z.minLength(1), z.maxLength(1000)),
  publicId: z.string().check(z.trim(), z.minLength(1), z.maxLength(255)),
  width: z.number().check(z.int(), z.positive()),
  height: z.number().check(z.int(), z.positive()),
  alt: z.string().check(z.trim(), z.minLength(1, IMAGE_MESSAGES.alt), z.maxLength(IMAGE_LIMITS.maxAlt, IMAGE_MESSAGES.alt)),
});

export const isImageFolderId = (publicId: string): boolean =>
  publicId.startsWith(`${IMAGE_LIMITS.folderRoot}/`) && !publicId.includes("..");

/** True for an https Cloudinary delivery URL (of the given cloud, when known). */
export function isOurCloudinaryUrl(url: string, cloudName?: string): boolean {
  return cloudName ? url.startsWith(`https://res.cloudinary.com/${cloudName}/`) : url.startsWith("https://res.cloudinary.com/");
}

/** Adds automatic format and quality (and a width) to a Cloudinary URL. Other URLs, and a URL already transformed, are returned as they are. */
export function optimizedUrl(url: string, width?: number): string {
  if (!isOurCloudinaryUrl(url)) return url;
  const marker = "/image/upload/";
  const at = url.indexOf(marker);
  if (at < 0) return url;
  const rest = url.slice(at + marker.length);
  if (/^f_auto/.test(rest)) return url;
  const transform = ["f_auto", "q_auto", ...(width ? [`w_${Math.round(width)}`] : [])].join(",");
  return `${url.slice(0, at + marker.length)}${transform}/${rest}`;
}

/**
 * The Cloudinary public id behind one of our delivery URLs (specs/033-admin-blog research R4), or null when the URL is not an
 * image of our cloud under tareeq/. Skips a transformation segment and the version, and drops the file extension.
 */
export function publicIdFromUrl(url: string, cloudName?: string): string | null {
  if (!isOurCloudinaryUrl(url, cloudName)) return null;
  const marker = "/image/upload/";
  const at = url.indexOf(marker);
  if (at < 0) return null;
  const parts = url.slice(at + marker.length).split("?")[0].split("#")[0].split("/");
  while (parts.length > 1 && !/^v\d+$/.test(parts[0]) && parts[0] !== IMAGE_LIMITS.folderRoot) parts.shift();
  if (/^v\d+$/.test(parts[0])) parts.shift();
  const id = parts.join("/").replace(/\.[a-z0-9]+$/i, "");
  return id.startsWith(`${IMAGE_LIMITS.folderRoot}/`) && !id.includes("..") ? id : null;
}
