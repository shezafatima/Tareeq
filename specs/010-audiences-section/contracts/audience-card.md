# Contract: AudienceCard

Server component, `components/sections/AudienceCard.tsx`.

**Props**: `audience: Audience`, `href: string` (resolved by the section), `external: boolean`.

**Markup**
```
<li data-reveal>                              <- Reveal
  <a class="aud-card lift" data-audience="{id}" href target? rel?>
    <span class="aud-tile" aria-hidden="true"> <Icon weight="duotone" /> </span>
    <span>
      <h3>{name}</h3>
      <p>{benefit}</p>
      <span class="aud-more">See how <ChevronRight/></span>
    </span>
  </a>
</li>
```
- Reveal wraps the `li`; the `a` carries the lift (never both on one element).
- External: `target="_blank" rel="noopener noreferrer"` plus sr-only "(opens in a new tab)".
- Touch target at least 44px high on mobile; focus ring uses the global outline.

**CSS hooks (globals.css)**: `--aud-strong` and `--aud-tint` set per `[data-audience]`; `.aud-tile::after` brightening overlay (opacity only); `@keyframes aud-teacher | aud-student | aud-cap | aud-laptop | aud-case`, 400ms or less, inside `prefers-reduced-motion: no-preference`; hover rules inside `@media (hover: hover)`.

**Section contract (`WhoItsFor`)**: empty list returns `null`; `ul` is a centred flex-wrap; missing WhatsApp number resolves to `/contact`.

**Errors**: none at runtime; an unmapped id uses the fallback icon and tint.
