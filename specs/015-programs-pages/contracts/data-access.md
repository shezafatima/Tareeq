# Contract: Program Data Access

**Module**: `src/lib/programs/data.ts` (`import "server-only"`). No other runtime module reads the `programs` collection.

| Function | Returns | On database failure |
|---|---|---|
| `getPublishedPrograms()` | `Program[]`, published only, sorted by `order` | Throws; nothing cached |
| `getProgramBySlug(slug)` | `Program`, or `null` when unknown, unpublished or malformed | Throws; nothing cached |
| `loadPublishedPrograms()` | Same as `getPublishedPrograms()`, or `null` for unavailable in build and dev | Build and dev: logs the error name, returns `null`. Production runtime: rethrows, so the last good page is kept |
| `getPublishedSlugs()` | `string[]` for `generateStaticParams` | Returns `[]` and logs the error name |

Rules:

- A malformed slug returns `null` without a database read, so junk addresses cannot grow the cache.
- `[]` means no programs. `null` means unavailable. Pages treat them differently.
- Logs carry the error name only, never the connection string or error message.

## Cache

| Read | Key | Tags | Time backstop |
|---|---|---|---|
| List | `["programs:published"]` | `programs` | 3600s |
| One program | `["program", slug]` | `programs`, `program:<slug>` | 3600s |

`revalidateTag("programs", profile)` refreshes everything. `revalidateTag("program:<slug>", profile)` refreshes one program's page. A save that changes list content must call both.

## Consumers

| Surface | Reads through | Unavailable result |
|---|---|---|
| Home `ProgramsPreview` | `loadPublishedPrograms()` | Section renders nothing |
| `/programs` | `loadPublishedPrograms()` | Friendly message, a link to the footer's contact details, and the fixed Online courses card |
| `/programs/[slug]` | `getProgramBySlug()` | `(site)/error.tsx` |
| `generateStaticParams` | `getPublishedSlugs()` | `[]`; pages generate on first request |
