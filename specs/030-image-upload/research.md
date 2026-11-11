# Research: Admin image upload and editable site images

**R1 Upload path.** Decision: the browser uploads directly to Cloudinary with a signed request (XHR, for real progress events). Why: file bytes never pass through our server (no body-size limit, no cost). Alternatives: upload through a Server Action (no progress, 1 MB default body limit) or a Route Handler (breaks the guard test's "no route handlers" rule).

**R2 Signing.** Decision: a `withAdmin` Server Action `signUpload` returns `{cloudName, apiKey, timestamp, folder, allowedFormats, signature}`, signed with the SDK's `utils.api_sign_request`. The signature covers `folder`, `allowed_formats` and `timestamp`, so a leaked signature can only upload an allowed format into our folder for about an hour. Cloudinary rejects stale timestamps.

**R3 Server verification (FR-002).** The upload response comes from the client, so it is not trusted. On save, for any image whose `publicId` is new, call the Admin API `resource(publicId)` and require: `format` in jpg/png/webp, `bytes` <= 5 MB, type `upload`, a publicId inside our folder prefix, and a `secure_url` on our cloud. Store the server's `url`, `width` and `height`; only `alt` comes from the client. A failed check deletes the stray asset (best effort) and rejects the save. An unchanged `publicId` skips the call. Alternatives: trust the client (rejected), or a signed upload preset with `max_file_size` (needs account setup; a later hardening).

**R4 Delivery.** Decision: store Cloudinary's `secure_url`; `optimizedUrl()` inserts `f_auto,q_auto` after `/upload/` and the result goes through `next/image` with explicit `sizes`. Alternative: a custom `loader` (a function cannot be passed from a Server Component to `Image`, and a global `loaderFile` would affect every image). `res.cloudinary.com` is already in `next.config.ts`.

**R5 Data shape.** Decision: a new optional `coverImage` sub-document on programs and courses; `coverImageUrl` stays untouched. Public precedence: `coverImage`, then `coverImageUrl`, then the brand pattern. Saving a new image unsets `coverImageUrl`; removing clears both. No migration (FR-009). A legacy URL shows in the uploader as the current image with no publicId, so nothing is deleted from Cloudinary for it.

**R6 Site image storage.** Decision: a separate `siteimages` collection with one document, `_id: "images"`, one field per slot key. It is not folded into `sitesettings`, so the `settings` and `site-images` cache tags stay independent. Slots are a code registry (`SITE_IMAGE_SLOTS`), so the admin list, defaults and recommended sizes live in one place. A stored key that is not in the registry is ignored.

**R7 Caching.** Decision: `getSiteImages()` is `unstable_cache(read, ["site-images"], {tags: ["site-images"], revalidate: 3600})` wrapped in `react.cache`, and it never throws (a database error logs the error name and returns the defaults). Save calls `revalidateTag("site-images", {expire: 0})`, matching the 028 pattern.

**R8 Failure fallback (FR-014).** Decision: `SafeImage`, a small client leaf, switches `src` to the slot default on `onError`. Covers are decorative over the brand pattern, so on error the image is just hidden. Alternative: server-side HEAD checks (slow, rejected).

**R9 Replace and remove cleanup (FR-005).** `resolveImageChange(prev, next)` returns the publicId to destroy when it differs from the new one. Destroy runs after the database write succeeds; errors are caught and logged by name only. Deleting a program or course also destroys its cover (best effort) to avoid obvious orphans. This small addition goes beyond the spec's wording and is called out in the tasks.

**R10 Guard test.** `images-actions.ts` exports `signUpload` and `saveSiteImages`; both go into `REQUIRED_ACTIONS`. Program and course actions are already covered. The Cloudinary SDK is stubbed to throw so the test proves no signing or API call happens without a session.

**R11 Missing config.** `signUpload` returns `{ok:false, code:"not_configured"}` when any of the three env values is missing. The uploader shows "Uploads are not set up yet" and existing images and defaults keep working.

**R12 Client checks.** `validateFile(file)` (pure, shared with tests): MIME is image/jpeg, image/png or image/webp and the extension agrees, size is at most 5 MB, and the file is not empty. The server uses the same constants.
