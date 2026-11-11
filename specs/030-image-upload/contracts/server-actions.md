# Server Actions

All are wrapped by `withAdmin`: with no session they return `{ok:false, code:"unauthorized"}` before any database or Cloudinary call. No Route Handlers are added.

## signUpload(input: { scope: "program" | "course" | "site" })

- ok: `{ ok:true, cloudName, apiKey, timestamp, folder, allowedFormats, signature }`, with folder `tareeq/<scope>`.
- errors: `unauthorized`, `invalid` (unknown scope), `not_configured`, `unavailable`.
- Never returns the API secret.

## saveSiteImages(values: { founderPhoto: StoredImageInput | null })

- Validates alt (required), verifies any new publicId (research R3), writes, destroys replaced assets, then `revalidateTag("site-images")` and `revalidatePath("/admin/settings/images")`.
- ok: `{ ok:true, values }`. errors: `unauthorized`, `invalid` (with `fieldErrors`), `image_rejected` (with a message), `unavailable`.

## createProgram, updateProgram, createCourse, updateCourse (changed)

- Accept `coverImage: StoredImageInput | null`. Same verification and cleanup; `coverImageUrl` is unset when a new image is saved or the image is removed. Existing error codes are unchanged; `image_rejected` is added.

## deleteProgram, deleteCourse (changed)

- After a successful delete, best-effort destroy the cover asset.

## Shared behavior

- `StoredImageInput` is `{url, publicId, width, height, alt}`. For a new asset the server ignores the client's url, width and height and uses the verified values.
- Destroy failures are caught, logged as `[images] destroy failed: <ErrorName>`, and never change the result.
