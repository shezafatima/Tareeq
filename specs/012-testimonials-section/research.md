# Research: Testimonials section

No NEEDS CLARIFICATION items remained. Decisions:

## 1. Video loading
- **Decision**: click-to-load facade; iframe from `https://www.youtube-nocookie.com/embed/<id>?autoplay=1&playsinline=1&rel=0` created after the click.
- **Rationale**: no third-party requests or JS before interaction (Principle VI); nocookie domain is the privacy-enhanced embed; autoplay is allowed because the click is a user gesture.
- **Alternatives**: eager iframes (heavy, 3+ YouTube loads); `lite-youtube-embed` package (new dependency, Principle IX); YouTube IFrame API (extra script, unnecessary).

## 2. One video at a time
- **Decision**: small client `VideoGroup` context holding `activeId`; each `TestimonialVideo` shows the iframe only while `activeId === its id`.
- **Rationale**: unmounting the iframe stops playback without the JS API; keeps the rest server-rendered (Principle XI).
- **Alternatives**: window custom events (implicit coupling); YouTube API `pauseVideo` (extra script).

## 3. URL parsing
- **Decision**: `parseYouTubeId(url)` using `new URL`; accepted hosts `youtube.com`, `www.`, `m.`, `youtube-nocookie.com`, `youtu.be`; accepted forms `/shorts/<id>`, `/watch?v=<id>`, `/embed/<id>`, `/live/<id>`, `youtu.be/<id>`; ID must match `^[A-Za-z0-9_-]{11}$`; returns `null` otherwise. Extra params/timestamps ignored.
- **Rationale**: strict host + ID check prevents arbitrary URLs reaching an iframe `src`.
- **Alternatives**: one big regex (harder to read, more edge-case bugs).

## 4. Poster image
- **Decision**: `https://i.ytimg.com/vi/<id>/hqdefault.jpg` via `next/image` with `unoptimized`, explicit width/height, `sizes`, `loading="lazy"`.
- **Rationale**: avoids touching `next.config` remotePatterns and avoids the optimiser fetching third-party images; still satisfies the "next/image with sizes" rule.
- **Alternatives**: `<img>` (breaks Principle VI wording); `remotePatterns` (config change, server fetch cost).

## 5. Placeholders
- **Decision**: `testimonials.dev.ts` imported dynamically only when `process.env.NODE_ENV !== "production"` and no real approved items exist. Placeholder text is obviously fake ("Placeholder name", "Role"), badge "Placeholder", no video.
- **Rationale**: Principle X forbids placeholder people that could pass as real; dynamic import behind a constant NODE_ENV check lets the bundler drop the module from production.
- **Alternatives**: flag inside the real data file (risk of shipping); fake YouTube IDs (broken embeds).

## 6. Glass style reuse
- **Decision**: new `.glass-card` class (`bg-white/70`, `ring-royal/10`, border, `backdrop-blur-md` on caption) copying the hero's token values.
- **Rationale**: Principle VIII forbids refactoring `Hero.tsx` to extract a shared class.
- **Alternatives**: edit Hero to share the class (needs approval, not worth it).

## 7. Layout
- **Decision**: `<ol>` snap strip on phones (card `w-[72vw] max-w-[280px]`), grid `md:grid-cols-3` with `justify-center`; section tone `soft` so the translucent glass reads against a tinted background.
- **Alternatives**: carousel library (dependency); stacked full-width 4:5 cards (too tall on phones).
