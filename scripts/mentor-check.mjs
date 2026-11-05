// Feature 011 check: node scripts/mentor-check.mjs  (BASE=http://localhost:3111 CHROME=<browser>)
// Release gate: node scripts/mentor-check.mjs --release  (no browser; fails while placeholders, null urls or null fact values remain)
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, readdirSync } from "node:fs";

let pass = 0, fail = 0;
const check = (n, ok, d = "") => { ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"}  ${n}${ok ? "" : `  (${d})`}`); };

if (process.argv.includes("--release")) {
  const src = readFileSync("src/content/mentor.ts", "utf8");
  const placeholders = src.match(/\[Placeholder[^\]]*\]/g) ?? [];
  check("no [Placeholder] text left", placeholders.length === 0, `${placeholders.length} left: ${placeholders.join(" | ")}`);
  check("no social with url: null", !/url:\s*null/.test(src), "url: null found");
  check("no fact with value: null", !/value:\s*null/.test(src), "value: null found");
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

const { chromium } = createRequire(import.meta.url)("@playwright/test");
const base = process.env.BASE ?? "http://localhost:3111";
const b = await chromium.launch({ executablePath: process.env.CHROME });
mkdirSync("shots/011", { recursive: true });
const SEC = "section[aria-labelledby='mentor-title']";

// static: no hex colours in the new components
for (const f of ["MentorSection", "MentorPhoto", "MentorSocialCard"]) {
  check(`${f}.tsx has no hex colour`, !/#[0-9a-fA-F]{3,8}\b/.test(readFileSync(`src/components/sections/${f}.tsx`, "utf8")));
  check(`${f}.tsx is a server component`, !/["']use client["']/.test(readFileSync(`src/components/sections/${f}.tsx`, "utf8")));
}

for (const w of [360, 390, 768, 1024, 1280, 1440]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
  const p = await ctx.newPage();
  const logs = [];
  p.on("console", (m) => { if (m.type() === "error") logs.push(m.text()); });
  p.on("pageerror", (e) => logs.push(e.message));
  const tag = `[${w}px]`;
  await p.goto(base + "/", { waitUntil: "load" });
  await p.waitForTimeout(6500);
  await p.locator(SEC).scrollIntoViewIfNeeded();
  await p.waitForTimeout(2200);

  // order: after Who it's for, before the final CTA
  const ids = await p.evaluate(() => [...document.querySelectorAll("main section[aria-labelledby]")].map((s) => s.getAttribute("aria-labelledby")));
  const wi = ids.indexOf("who-title"), mi = ids.indexOf("mentor-title");
  check(`${tag} follows Who it's for`, wi >= 0 && mi === wi + 1, ids.join(","));
  check(`${tag} heading and eyebrow`, (await p.locator(`${SEC} h2`).innerText()) === "Meet your mentor" && (await p.locator(`${SEC} p`).first().innerText()).trim().toLowerCase() === "your mentor");
  check(`${tag} greeting`, (await p.locator(`${SEC} h3`).innerText()).includes("Hi, I'm Sheza Fatima"));

  // photo
  const img = p.locator(`${SEC} img`);
  const ia = await img.evaluate((e) => ({ alt: e.alt, w: e.getAttribute("width"), h: e.getAttribute("height"), loading: e.loading }));
  check(`${tag} photo alt/size/lazy`, ia.alt === "Sheza Fatima, founder of Tareeq" && ia.w === "1122" && ia.h === "1402" && ia.loading === "lazy", JSON.stringify(ia));
  const box = await img.evaluate((e) => { const r = e.parentElement.getBoundingClientRect(); const c = e.closest("div.grid").getBoundingClientRect(); return { ratio: r.width / r.height, frac: r.width / c.width, left: r.left, cleft: c.left }; });
  check(`${tag} photo box is 4:5`, Math.abs(box.ratio - 0.8) < 0.02, box.ratio.toFixed(3));
  if (w >= 1024) check(`${tag} photo about 40% of card`, box.frac > 0.3 && box.frac < 0.45, box.frac.toFixed(2));

  if (w <= 400) check(`${tag} photo is small on phones (<= 220px wide)`, (await img.evaluate((e) => e.parentElement.getBoundingClientRect().width)) <= 220, "");
  // layout / overflow
  const sw = await p.evaluate(() => document.documentElement.scrollWidth);
  check(`${tag} no horizontal scroll`, sw <= w, `scrollWidth ${sw}`);
  const order = await p.evaluate(() => { const i = document.querySelector("section[aria-labelledby='mentor-title'] img").getBoundingClientRect(); const t = document.querySelector("section[aria-labelledby='mentor-title'] h3").getBoundingClientRect(); return { sideBySide: t.left > i.right - 2, above: t.top >= i.bottom - 2 }; });
  check(`${tag} layout ${w >= 1024 ? "photo left, text right" : "photo above text"}`, w >= 1024 ? order.sideBySide : order.above, JSON.stringify(order));

  // socials
  const links = await p.locator(`${SEC} a`).evaluateAll((as) => as.map((a) => ({ href: a.href, target: a.target, rel: a.rel, name: a.getAttribute("aria-label"), h: a.getBoundingClientRect().height, x: a.getBoundingClientRect().left })));
  check(`${tag} socials: YouTube, LinkedIn, Instagram`, links.length === 3 && /youtube\.com\/@/.test(links[0].href) && /linkedin\.com\/in\//.test(links[1].href) && /instagram\.com\/talksbysheza/.test(links[2].href), JSON.stringify(links.map((l) => l.href)));
  check(`${tag} socials open in new tab safely`, links.every((l) => l.target === "_blank" && /noopener/.test(l.rel) && /noreferrer/.test(l.rel)));
  check(`${tag} socials accessible names`, links[0]?.name === "Sheza Fatima on YouTube, 1.7k subscribers" && links[1]?.name === "Sheza Fatima on LinkedIn, 2k+ followers" && links[2]?.name === "Sheza Fatima on Instagram", JSON.stringify(links.map((l) => l.name)));
  check(`${tag} social targets >= 44px`, links.every((l) => l.h >= 44), links.map((l) => l.h).join(","));
  const cols = new Set(links.map((l) => Math.round(l.x))).size;
  check(`${tag} social grid ${w < 400 ? "1 column" : "2 columns"}`, cols === (w < 400 ? 1 : 2), `cols ${cols}`);
  check(`${tag} no TikTok/X link`, !/tiktok|twitter|x\.com/i.test(links.map((l) => l.href).join(" ")));
  check(`${tag} decorative icons hidden`, (await p.locator(`${SEC} a svg[aria-hidden='true']`).count()) === 3);

  // credentials: two real facts are shown
  const facts = await p.locator(`${SEC} li:has(> span.block)`).allInnerTexts();
  check(`${tag} credentials row shows the two real facts`, facts.length === 2 && /3 years/.test(facts[0]) && /30/.test(facts[1]), JSON.stringify(facts));
  check(`${tag} quote block present with saffron border`, await p.locator(`${SEC} blockquote`).evaluate((e) => getComputedStyle(e).borderLeftWidth === "4px" && getComputedStyle(e).borderLeftColor.startsWith("rgb(242, 169, 59)")));

  // hover lift 2px + border warms (pointer devices)
  if (w === 1280) {
    const a = p.locator(`${SEC} a`).first();
    const before = await a.evaluate((e) => getComputedStyle(e).transform);
    await a.hover(); await p.waitForTimeout(500);
    const after = await a.evaluate((e) => ({ t: getComputedStyle(e).transform, b: getComputedStyle(e).borderTopColor }));
    check(`${tag} social lifts 2px on hover`, /matrix\(1, 0, 0, 1, 0, -2\)/.test(after.t) && (before === "none" || before.endsWith("0)")), `${before} -> ${after.t}`);
    check(`${tag} border warms to saffron on hover`, after.b.startsWith("rgb(242, 169, 59)"), after.b);
    // glow animates transform/opacity only
    const anim = await p.evaluate(() => { const g = document.querySelector(".mentor-glow"); const a = g.getAnimations().map((x) => x.effect.getKeyframes().flatMap((k) => Object.keys(k))); return a.flat(); });
    const props = new Set(anim.filter((k) => !["offset", "easing", "composite", "computedOffset"].includes(k)));
    check(`${tag} glow animation uses transform/opacity only`, props.size > 0 && [...props].every((k) => k === "transform" || k === "opacity"), [...props].join(","));
    await p.screenshot({ path: `shots/011/${w}-section.png`, clip: await p.locator(SEC).boundingBox() });
  }
  if (w === 360 || w === 1440) await p.locator(SEC).screenshot({ path: `shots/011/${w}.png` });
  check(`${tag} no console errors`, logs.length === 0, logs.join(" | "));
  await ctx.close();
}

// reduced motion: nothing moves
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  const p = await ctx.newPage();
  await p.goto(base + "/", { waitUntil: "load" });
  await p.waitForTimeout(6500);
  await p.locator(SEC).scrollIntoViewIfNeeded();
  await p.waitForTimeout(800);
  const st = await p.evaluate(() => { const g = getComputedStyle(document.querySelector(".mentor-glow")); const ph = getComputedStyle(document.querySelector(".mentor-photo")); return { anim: g.animationName, photoT: ph.transform, photoO: ph.opacity }; });
  check("[reduced] glow does not animate", st.anim === "none", st.anim);
  check("[reduced] photo visible, no transform", st.photoO === "1" && st.photoT === "none", JSON.stringify(st));
  const a = p.locator(`${SEC} a`).first();
  await a.hover(); await p.waitForTimeout(500);
  check("[reduced] no lift on hover", (await a.evaluate((e) => getComputedStyle(e).transform)) === "none");
  await ctx.close();
}

await b.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
