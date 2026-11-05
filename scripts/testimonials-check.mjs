// Feature 012 check: node scripts/testimonials-check.mjs  (BASE=http://localhost:3111 CHROME=<browser>)
//   dev server: shows 3 placeholders (layout checks); with a real approved item in src/content/testimonials.ts it also runs the play checks.
// Release gate: node scripts/testimonials-check.mjs --release  (against a production server; BASE as above)
//   fails if the section or the word "Placeholder" appears while no real approved item is configured.
import { createRequire } from "node:module";
import { mkdirSync, readFileSync } from "node:fs";

let pass = 0, fail = 0;
const check = (n, ok, d = "") => { ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"}  ${n}${ok ? "" : `  (${d})`}`); };
const base = process.env.BASE ?? "http://localhost:3111";
const dataSrc = readFileSync("src/content/testimonials.ts", "utf8");
const realConfigured = /consent:\s*true/.test(dataSrc) && /published:\s*true/.test(dataSrc);

if (process.argv.includes("--release")) {
  const html = await (await fetch(base + "/")).text();
  check("no 'Placeholder' text in the production page", !/placeholder name|Placeholder quote/i.test(html));
  check(realConfigured ? "section present (real items configured)" : "section absent (no real items)", realConfigured === html.includes('id="testimonials"'));
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

const { chromium } = createRequire(import.meta.url)("@playwright/test");
const b = await chromium.launch({ executablePath: process.env.CHROME });
mkdirSync("shots/012", { recursive: true });
const SEC = "section[aria-labelledby='testimonials-title']";

for (const f of ["TestimonialsSection", "TestimonialCard", "TestimonialVideo", "VideoGroup"]) {
  const s = readFileSync(`src/components/sections/${f}.tsx`, "utf8");
  check(`${f}.tsx has no hex colour`, !/#[0-9a-fA-F]{3,8}\b/.test(s));
  const client = /^["']use client["']/.test(s);
  check(`${f}.tsx ${["TestimonialVideo", "VideoGroup"].includes(f) ? "is" : "is not"} a client component`, client === ["TestimonialVideo", "VideoGroup"].includes(f));
}

for (const w of [360, 390, 768, 1024, 1440]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
  const p = await ctx.newPage();
  const logs = [], reqs = [];
  p.on("console", (m) => { if (m.type() === "error") logs.push(m.text()); });
  p.on("pageerror", (e) => logs.push(e.message));
  p.on("request", (r) => reqs.push(r.url()));
  const tag = `[${w}px]`;
  await p.goto(base + "/", { waitUntil: "load" });
  await p.waitForTimeout(6500);
  await p.locator(SEC).scrollIntoViewIfNeeded();
  await p.waitForTimeout(2200);

  const ids = await p.evaluate(() => [...document.querySelectorAll("main section[aria-labelledby]")].map((s) => s.getAttribute("aria-labelledby")));
  const mi = ids.indexOf("mentor-title"), ti = ids.indexOf("testimonials-title");
  check(`${tag} follows the mentor section`, mi >= 0 && ti === mi + 1, ids.join(","));
  check(`${tag} heading is an h2`, (await p.locator(`${SEC} h2`).count()) === 1);
  const cards = p.locator(`${SEC} ol > li`);
  const n = await cards.count();
  check(`${tag} cards render`, n >= 1, String(n));
  const real = (await p.locator(`${SEC} span:text-is('Placeholder')`).count()) === 0;

  const dims = await cards.evaluateAll((els) => els.map((e) => { const v = e.querySelector("figure"); return { r: v.offsetWidth / v.offsetHeight, w: v.offsetWidth }; }));
  check(`${tag} card is 4:5`, dims.every((d) => Math.abs(d.r - 4 / 5) < 0.012), JSON.stringify(dims));
  const sw = await p.evaluate(() => document.documentElement.scrollWidth);
  check(`${tag} no horizontal page scroll`, sw <= w, `scrollWidth ${sw}`);
  const clipped = await cards.evaluateAll((els) => els.some((e) => { const f = e.querySelector("figcaption"); return f.scrollWidth > f.clientWidth + 1; }));
  check(`${tag} caption text not clipped`, !clipped);
  const first = await cards.first().evaluate((e) => { const b = e.getBoundingClientRect(); return { l: b.left, r: b.right }; }); // rotated box, a few px of slack
  check(`${tag} first card fully on screen`, first.l >= -8 && first.r <= w + 8, JSON.stringify(first));
  if (w >= 768) {
    const xs = await cards.evaluateAll((els) => els.map((e) => e.offsetTop));
    check(`${tag} desktop grid: cards share a row`, new Set(xs).size === 1, xs.join(","));
  }
  const gc = await p.locator(`${SEC} figure`).first().evaluate((e) => getComputedStyle(e).backgroundColor);
  check(`${tag} glass card background is translucent white`, /rgba\(255, 255, 255, 0\.7|color\(srgb 1 1 1 \/ 0\.7/.test(gc), gc);

  const play = p.locator(`${SEC} button`);
  const boxes = await play.evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).map((r) => [r.width, r.height]));
  check(`${tag} play targets >= 44px`, boxes.every(([bw, bh]) => bw >= 44 && bh >= 44));
  check(`${tag} every card has a play button with a name`, (await play.evaluateAll((els) => els.every((e) => e.getAttribute("aria-label")))) );
  check(`${tag} no YouTube player requests before a click`, !reqs.some((u) => /youtube(-nocookie)?\.com/.test(u)), reqs.filter((u) => /youtube/.test(u)).join(","));
  if (!real) {
    check(`${tag} placeholders: all play buttons disabled`, await play.evaluateAll((els) => els.every((e) => e.disabled)));
    check(`${tag} placeholders: 3 cards, no ytimg poster request`, n === 3 && !reqs.some((u) => /ytimg/.test(u)), `${n} ${reqs.filter((u) => /ytimg/.test(u))}`);
  } else if (w === 390) {
    // play checks need real items
    await play.first().click();
    await p.waitForTimeout(500);
    check(`${tag} click starts exactly one iframe`, (await p.locator(`${SEC} iframe`).count()) === 1);
    const src = await p.locator(`${SEC} iframe`).getAttribute("src");
    check(`${tag} iframe is nocookie autoplay`, /^https:\/\/www\.youtube-nocookie\.com\/embed\/[\w-]{11}\?.*autoplay=1/.test(src ?? ""), String(src));
    if (n > 1) {
      // the playing card has no play button now, so the first remaining one belongs to another card
      const other = p.locator(`${SEC} button[aria-label^='Play video from']`).first();
      await other.scrollIntoViewIfNeeded();
      await other.click();
      await p.waitForTimeout(500);
      check(`${tag} playing another card stops the first`, (await p.locator(`${SEC} iframe`).count()) === 1);
    }
  }
  await p.locator(SEC).screenshot({ path: `shots/012/${w}.png` });
  check(`${tag} no console errors`, logs.filter((l) => !/ytimg|youtube|Failed to load resource/.test(l)).length === 0, logs.join(" | "));
  await ctx.close();
}

// keyboard: Tab reaches a play button with a visible focus style; reduced motion does not break the layout
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  const p = await ctx.newPage();
  await p.goto(base + "/", { waitUntil: "load" });
  await p.waitForTimeout(6500);
  const btn = p.locator(`${SEC} button:not([disabled])`).first();
  if (await btn.count()) {
    await btn.focus();
    const o = await btn.evaluate((e) => getComputedStyle(e).outlineStyle);
    check("[kbd] enabled play button shows a focus outline", o !== "none", o);
    await p.keyboard.press("Enter");
    await p.waitForTimeout(500);
    check("[kbd] Enter starts playback", (await p.locator(`${SEC} iframe`).count()) === 1);
  } else check("[kbd] (skipped: only placeholders present)", true);
  await ctx.close();
}

await b.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
