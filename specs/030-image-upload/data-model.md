# Data Model

## StoredImage (embedded)

| Field | Type | Rules |
|---|---|---|
| url | string | `https://res.cloudinary.com/<our cloud>/image/upload/...`, set by the server from verification |
| publicId | string | starts with `tareeq/`, max 255, set by the server |
| width, height | integer | greater than 0, from verification |
| alt | string | trimmed, 1 to 200 characters, required |

## Program and Course (changed)

- Add optional `coverImage: StoredImage`.
- `coverImageUrl` stays (legacy, read-only fallback).
- Public cover = `coverImage` if present, else `coverImageUrl` if allowed, else none (brand pattern).
- Form value shape: `coverImage: StoredImage | null` plus `legacyCoverUrl: string` (read-only, shown as the current image).

## SiteImages (new, collection `siteimages`)

One document, `_id: "images"`, with one optional `StoredImage` field per slot key (`founderPhoto`). Empty values are not stored (unset), as in site settings.

## Slot registry (code, not stored)

`{ key, label, recommended, defaultSrc, defaultWidth, defaultHeight, defaultAlt }`. The effective image is the stored image or the default.

## Transitions

- Upload (client): lives in form state only.
- Save: verify (new publicId only), write, destroy the replaced asset, revalidate.
- Remove: unset the field, destroy the old asset.
