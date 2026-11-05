# Contract: How it works content

Owner-editable data lives in `src/content/how-it-works.ts` and is read through `getHowItWorks(): Promise<HowItWorksContent>` in `src/content/index.ts` (unchanged signature). Shape: see [data-model.md](../data-model.md).

Rules:
- Exactly three steps in order: prompt, build, learn.
- `title` is the owner's wording; `line` is a DRAFT placeholder, marked with a comment at the top of the file for owner review (Principle X).
- Paths point inside `public/videos/how-it-works/`; files must exist and videos must be ≤ 3 MB, ≤ 720p, no audio track.
- Removing `example` from `HowStep` means any other reader of that field must be removed too (only the deleted `CarouselCard` reads it).
- No admin editing (out of scope).
