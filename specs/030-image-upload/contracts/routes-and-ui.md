# Routes and UI

## /admin/settings/images (new, requireAdmin)

- H1 "Site images", an intro line, and one card per slot: label, recommended size, current preview (stored image or default, with a "Default" chip), the ImageUploader, and a Save button using the existing action-feedback toast and unsaved-changes guard.
- "Use default" (remove) clears the slot. Unreadable data shows `UnavailableNotice`.
- Linked from `/admin/settings` ("Site images" link under the intro).

## ImageUploader (client)

Props: `value`, `onChange`, `scope`, `label`, `error`, `legacyUrl?`, `recommended?`, `disabled?`.

States: empty, dragging, rejected (type or size), uploading (progressbar and cancel), uploaded (preview, alt field, Replace, Remove), legacy (preview, Replace, Remove), not configured, upload failed (retry).

- Keyboard: the drop zone is a button (Enter or Space opens the picker); Replace, Remove and Cancel are buttons; focus returns to the zone after Remove; errors are announced through `aria-live="polite"`.
- Reduced motion: the progress bar width updates without easing.
- 360px: single column, buttons stack, preview is at most 100% wide.

## Public

- `SafeImage` (client leaf) wraps `next/image`; `onError` swaps to the default src.
- `ProgramCover` takes `{coverImage, legacyUrl}`; the brand pattern stays underneath and the image is hidden on error.
- Mentor section: `getMentor()` merges `getSiteImages().founderPhoto`; alt comes from the stored alt.
- Program and course share images use the cover when present (the `/robot.png` fallback is unchanged).
