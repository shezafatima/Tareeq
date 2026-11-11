import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { IMAGE_LIMITS, isImageFolderId, isOurCloudinaryUrl } from "@/lib/images/shared";

// The only module that touches the Cloudinary SDK or the API secret (specs/030-image-upload research R1-R3, R9).
// Nothing here is imported by client code.

export const UPLOAD_SCOPES = ["program", "course", "site"] as const;
export type UploadScope = (typeof UPLOAD_SCOPES)[number];

type Config = { cloudName: string; apiKey: string; apiSecret: string };

function readConfig(): Config | null {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  return cloudName && apiKey && apiSecret ? { cloudName, apiKey, apiSecret } : null;
}

export const isConfigured = (): boolean => readConfig() !== null;

function client(config: Config) {
  cloudinary.config({ cloud_name: config.cloudName, api_key: config.apiKey, api_secret: config.apiSecret, secure: true });
  return cloudinary;
}

const errorName = (err: unknown) => (err instanceof Error ? err.name : "UnknownError");

export type UploadSignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  allowedFormats: string;
  signature: string;
};

/** Signs an upload into tareeq/<scope>. Returns null when not configured. The secret is used here and never returned. */
export function signUploadParams(scope: UploadScope): UploadSignature | null {
  const config = readConfig();
  if (!config) return null;
  const timestamp = Math.round(Date.now() / 1000);
  const folder = `${IMAGE_LIMITS.folderRoot}/${scope}`;
  const allowedFormats = IMAGE_LIMITS.formats.join(",");
  const signature = client(config).utils.api_sign_request({ allowed_formats: allowedFormats, folder, timestamp }, config.apiSecret);
  return { cloudName: config.cloudName, apiKey: config.apiKey, timestamp, folder, allowedFormats, signature };
}

export class ImageRejected extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageRejected";
  }
}

export type VerifiedAsset = { url: string; width: number; height: number };

/** Looks the uploaded asset up at Cloudinary and checks it against our rules. Throws ImageRejected for a bad asset, any other error for an outage. */
export async function verifyAsset(publicId: string): Promise<VerifiedAsset> {
  const config = readConfig();
  if (!config) throw new Error("NotConfigured");
  if (!isImageFolderId(publicId)) throw new ImageRejected("wrong folder");
  let resource: { format?: string; bytes?: number; type?: string; secure_url?: string; width?: number; height?: number };
  try {
    resource = await client(config).api.resource(publicId, { resource_type: "image", type: "upload" });
  } catch (err) {
    const status = (err as { error?: { http_code?: number }; http_code?: number })?.error?.http_code ?? (err as { http_code?: number })?.http_code;
    if (status === 404) throw new ImageRejected("not found");
    throw err;
  }
  const ok =
    resource.type === "upload" &&
    typeof resource.format === "string" &&
    IMAGE_LIMITS.formats.includes(resource.format) &&
    typeof resource.bytes === "number" &&
    resource.bytes > 0 &&
    resource.bytes <= IMAGE_LIMITS.maxBytes &&
    typeof resource.secure_url === "string" &&
    isOurCloudinaryUrl(resource.secure_url, config.cloudName) &&
    Number.isInteger(resource.width) &&
    Number.isInteger(resource.height);
  if (!ok) {
    await destroyAsset(publicId);
    throw new ImageRejected("failed checks");
  }
  return { url: resource.secure_url as string, width: resource.width as number, height: resource.height as number };
}

/** Best effort: a failure is logged by error name only and never thrown. */
export async function destroyAsset(publicId: string): Promise<void> {
  const config = readConfig();
  if (!config || !isImageFolderId(publicId)) return;
  try {
    await client(config).uploader.destroy(publicId, { resource_type: "image", invalidate: true });
  } catch (err) {
    console.error(`[images] destroy failed: ${errorName(err)}`);
  }
}
