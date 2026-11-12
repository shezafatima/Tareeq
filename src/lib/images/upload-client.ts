// Browser-side direct upload to Cloudinary with real progress (specs/032-admin-gallery research R6). Extracted from ImageUploader
// so the single-image uploader and the gallery's multi-file uploader share one implementation. Never sees the API secret:
// the signature comes from the signUpload Server Action. Type-only import, so no server code reaches the browser.
import type { UploadSignature } from "@/lib/cloudinary/server";

export type UploadedAsset = { publicId: string; url: string; width: number; height: number };

export function uploadToCloudinary(
  file: File,
  upload: UploadSignature,
  opts: { onProgress?: (percent: number) => void; signal?: AbortSignal } = {},
): Promise<UploadedAsset> {
  return new Promise((resolve, reject) => {
    const aborted = () => new DOMException("Aborted", "AbortError");
    if (opts.signal?.aborted) return reject(aborted());

    const body = new FormData();
    body.append("file", file);
    body.append("api_key", upload.apiKey);
    body.append("timestamp", String(upload.timestamp));
    body.append("signature", upload.signature);
    body.append("folder", upload.folder);
    body.append("allowed_formats", upload.allowedFormats);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${upload.cloudName}/image/upload`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) opts.onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onerror = () => reject(new Error("UploadFailed"));
    xhr.onabort = () => reject(aborted());
    xhr.onload = () => {
      try {
        const res = JSON.parse(xhr.responseText) as { public_id?: string; secure_url?: string; width?: number; height?: number };
        if (xhr.status >= 200 && xhr.status < 300 && res.public_id && res.secure_url && res.width && res.height) {
          return resolve({ publicId: res.public_id, url: res.secure_url, width: res.width, height: res.height });
        }
      } catch {
        /* fall through to the rejection below */
      }
      reject(new Error("UploadFailed"));
    };
    opts.signal?.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(body);
  });
}
