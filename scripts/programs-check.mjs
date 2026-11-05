// Feature 009 check: node scripts/programs-check.mjs  (BASE=http://localhost:3109 CHROME=<browser> WA=0 to expect no WhatsApp number)
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
const { chromium } = createRequire(import.meta.url)("@playwright/test");
const base = process.env.BASE ?? "http://localhost:3109";
const expectWa = process.env.WA !== "0";
const b = await chromium.launch({ executablePath: process.env.CHROME });
let pass = 0, fail = 0;
const check = (n, ok, d = "") => { ok ? pass++ : fail++; console.log(`${ok ? "PASS" : "FAIL"}  ${n}${ok ? "" : `  (${d})`}`); };
mkdirSync("shots/009", { recursive: true });

const titles = ["AI for Teachers workshop", "School student workshops", "Online courses"]; // coming-soon cards are hidden on the home page
const chips = ["Booking now", "Booking now", "Register interest"];
const SEC = "section[aria-labelledby='programs-title']";

// WCAG contrast of a text element against its effective background (walks up for the first opaque colour, blends alphas)
const contrastFn = () => {
  const cv = document.createElement("canvas"); cv.width = cv.height = 1; const cx = cv.getContext("2d", { willReadFrequently: true });
  const parse = (c) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = "#000"; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; if (d[3] === 0) return [0, 0, 0, 0]; return [d[0], d[1], d[2], d[3] / 255]; };
  const blend = (f, bg) => [f[0] * f[3] + bg[0] * (1 - f[3]), f[1] * f[3] + bg[1] * (1 - f[3]), f[2] * f[3] + bg[2] * (1 - f[3])];
  const lum = (c) => { const a = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]; };
  const bgOf = (el) => { const stack = []; for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c[3] > 0) { stack.push(c); if (c[3] === 1) break; } } let out = [250, 247, 242]; for (const c of stack.reverse()) out = blend(c, out); return out; };
  const ratio = (el) => { const bg = bgOf(el); const fg = parse(getComputedStyle(el).color); const f = blend(fg, bg); const [a, b2] = [lum(f), lum(bg)]; return (Math.max(a, b2) + 0.05) / (Math.min(a, b2) + 0.05); };
  return [...document.querySelectorAll("section[aria-labelledby='programs-title'] article")].flatMap((card) =>
    [...card.querySelectorAll("p, h3, dt, dd, a")].filter((e) => e.textContent.trim()).map((e) => ({ card: card.dataset.variant, text: e.textContent.trim().slice(0, 24), r: Math.round(ratio(e) * 100) / 100 })));
};

for (const w of [360, 390, 768, 1024, 1440]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
  const p = await ctx.newPage();
  const logs = [];
  p.on("console", (m) => { if (m.type() === "error") logs.push(m.text()); });
  p.on("pageerror", (e) => logs.push(e.message));
  const tag = `[${w}px]`;
  await p.goto(base + "/", { waitUntil: "load" });
  await p.waitForTimeout(6500);
  await p.locator(SEC).scrollIntoViewIfNeeded();
  await p.waitForTimeout(1800);

  // content
  check(`${tag} three cards in order`, JSON.stringify(await p.locator(`${SEC} article h3`).allTextContents()) === JSON.stringify(titles), (await p.locator(`${SEC} article h3`).allTextContents()).join("|"));
  check(`${tag} status chips`, JSON.stringify(await p.locator(`${SEC} article > p:first-child`).allInnerTexts().then((a) => a.map((t) => t.trim().toLowerCase()))) === JSON.stringify(chips.map((c) => c.toLowerCase())), "");
  check(`${tag} 'all programs' link kept`, (await p.locator(`${SEC} a[href="/programs"]`).count()) === 1);
  check(`${tag} one h2, three h3`, (await p.locator(`${SEC} h2`).count()) === 1 && (await p.locator(`${SEC} h3`).count()) === 3);

  // structure: chip, h3, audience, dl, cta in DOM order on every card
  const structure = await p.evaluate((sel) => [...document.querySelectorAll(`${sel} article`)].map((a) => {
    const q = (s) => a.querySelector(s);
    const order = ["p", "h3", "p + p, h3 + p", "dl", "a"].map((s) => q(s));
    const pos = (n) => (n ? [...a.querySelectorAll("*")].indexOf(n) : -1);
    const facts = a.querySelectorAll("dl > div").length;
    return { ok: pos(order[0]) < pos(order[1]) && pos(order[1]) < pos(order[2]) && (pos(order[3]) < 0 || pos(order[2]) < pos(order[3])), facts, hasCta: !!q("a") };
  }), SEC);
  check(`${tag} same structure on every card, 2-3 facts`, structure.every((s) => s.ok && s.facts >= 2 && s.facts <= 3), JSON.stringify(structure));

  // layout
  const boxes = await p.evaluate((sel) => [...document.querySelectorAll(`${sel} ul > li`)].map((l) => { const r = l.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y + scrollY), w: Math.round(r.width), h: Math.round(r.height) }; }), SEC);
  check(`${tag} no horizontal scroll`, await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  check(`${tag} no card wider than the screen`, boxes.every((x) => x.x >= 0 && x.x + x.w <= w + 1));
  check(`${tag} all cards are the same size`, new Set(boxes.map((r) => r.w)).size === 1 && new Set(boxes.map((r) => r.h)).size === 1, JSON.stringify(boxes));
  if (w >= 1024) {
    check(`${tag} three cards in one row`, new Set(boxes.map((r) => r.y)).size === 1 && new Set(boxes.map((r) => r.x)).size === 3, JSON.stringify(boxes));
  } else if (w >= 768) {
    check(`${tag} two columns, last card centred`, boxes[0].y === boxes[1].y && boxes[2].y > boxes[0].y && boxes[2].x > boxes[0].x && boxes[2].x < boxes[1].x, JSON.stringify(boxes));
  } else {
    check(`${tag} single column in order`, boxes.every((x, i) => x.x === boxes[0].x && (i === 0 || x.y > boxes[i - 1].y)), JSON.stringify(boxes));
  }
  const overflow = await p.evaluate((sel) => [...document.querySelectorAll(`${sel} article`)].filter((a) => [...a.querySelectorAll("*")].some((e) => e.getBoundingClientRect().right > a.getBoundingClientRect().right + 1 || e.getBoundingClientRect().left < a.getBoundingClientRect().left - 1)).length, SEC);
  check(`${tag} nothing overflows inside a card`, overflow === 0, String(overflow));

  // same surface on every card
  const surf = await p.evaluate((sel) => [...document.querySelectorAll(`${sel} article`)].map((a) => getComputedStyle(a).backgroundColor), SEC);
  check(`${tag} every card has the same surface`, new Set(surf).size === 1 && surf[0] === "rgb(255, 255, 255)", surf.join());

  // ctas
  const ctas = await p.evaluate((sel) => [...document.querySelectorAll(`${sel} article a`)].map((a) => ({ href: a.getAttribute("href"), name: a.textContent.trim(), t: a.target, rel: a.rel, h: Math.round(a.getBoundingClientRect().height) })), SEC);
  check(`${tag} booking and register links`, ctas[0]?.href === "/workshop?book=1" && ctas[1]?.href === "/workshop?book=1" && ctas[2]?.href === "/register" && ctas[0].name.startsWith("Book a workshop"), JSON.stringify(ctas.slice(0, 3)));
  if (expectWa) {
    const wa = ctas.slice(3);
    const msgs = wa.map((c) => decodeURIComponent((c.href.split("text=")[1] ?? "")));
    check(`${tag} no coming-soon card or WhatsApp link in the section`, wa.length === 0 && !(await p.locator(`${SEC} article[data-status="coming-soon"]`).count()), JSON.stringify(wa));
  } else {
    check(`${tag} no WhatsApp number: coming-soon CTAs omitted, no empty links`, ctas.length === 3 && ctas.every((c) => c.href && c.href !== "#"), JSON.stringify(ctas));
  }
  check(`${tag} CTA names include the program, 44px tall`, ctas.every((c, i) => c.name.includes(titles[i])) && ctas.every((c) => c.h >= 44), JSON.stringify(ctas));

  // a11y: one tab stop per card, card is not a link
  const stops = await p.evaluate((sel) => [...document.querySelectorAll(`${sel} article`)].map((a) => a.querySelectorAll("a[href], button, input, select, textarea, [tabindex]").length), SEC);
  check(`${tag} at most one focusable per card; card not a link`, stops.every((n) => n <= 1) && (await p.locator(`${SEC} a:has(article), ${SEC} article[tabindex]`).count()) === 0, JSON.stringify(stops));
  check(`${tag} decoration hidden from assistive tech`, await p.evaluate((sel) => [...document.querySelectorAll(`${sel} svg`)].every((e) => e.closest("[aria-hidden='true']") || e.getAttribute("aria-hidden") === "true"), SEC));

  // contrast
  const cr = await p.evaluate(contrastFn);
  const bad = cr.filter((x) => x.r < 4.5);
  check(`${tag} text contrast >= 4.5:1 on every card (min ${Math.min(...cr.map((x) => x.r))})`, bad.length === 0, JSON.stringify(bad));

  // motion: lift, border, chevron, glow
  if (w === 1440) {
    const card = p.locator(`${SEC} article`).nth(1);
    const before = await card.evaluate((a) => ({ t: getComputedStyle(a).transform, bc: getComputedStyle(a).borderTopColor, chev: getComputedStyle(a.querySelector("a svg")).translate }));
    await card.hover();
    await p.waitForTimeout(700);
    const after = await card.evaluate((a) => ({ t: getComputedStyle(a).transform, bc: getComputedStyle(a).borderTopColor, chev: getComputedStyle(a.querySelector("a svg")).translate }));
    const ty = (m) => { const v = m.match(/matrix\(([^)]+)\)/); return v ? parseFloat(v[1].split(",")[5]) : 0; };
    const tx = (m) => (m && m !== "none" ? parseFloat(m) : 0);
    check(`${tag} hover lifts the card 4px`, Math.abs(ty(after.t) + 4) < 0.6, after.t);
    check(`${tag} hover warms the border`, before.bc !== after.bc, `${before.bc} -> ${after.bc}`);
    check(`${tag} hover slides the chevron 4px`, Math.abs(tx(after.chev) - 4) < 0.6 && tx(before.chev) === 0, after.chev);
    await p.mouse.move(5, 5);
    await p.screenshot({ path: `shots/009/programs-${w}.png` });
  }
  if (w === 390) { await p.screenshot({ path: `shots/009/programs-${w}.png` }); }
  check(`${tag} no console errors`, logs.length === 0, logs.join(" | "));
  await ctx.close();
}

// entrance: cards start hidden, then fade in with a stagger, once
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(base + "/", { waitUntil: "load" });
  await p.waitForTimeout(6500);
  await p.evaluate(() => document.querySelector("#programs").scrollIntoView({ block: "start" }));
  await p.evaluate(() => window.scrollBy(0, -document.querySelector("#programs").getBoundingClientRect().height));
  await p.evaluate(() => window.scrollTo(0, 0));
  const hidden = await p.evaluate(() => [...document.querySelectorAll("#programs ul > li")].map((l) => getComputedStyle(l).opacity));
  check("[entrance] cards below the fold start hidden", hidden.every((o) => o === "0"), hidden.join(","));
  await p.evaluate(() => document.querySelector("#programs ul").scrollIntoView({ block: "center" }));
  const first = [null, null, null];
  for (let t = 0; t < 40; t++) {
    const o = await p.evaluate(() => [...document.querySelectorAll("#programs ul > li")].map((l) => parseFloat(getComputedStyle(l).opacity)));
    o.forEach((v, i) => { if (first[i] === null && v > 0.05) first[i] = t; });
    await p.waitForTimeout(30);
  }
  const mid = first;
  const end = await p.evaluate(() => [...document.querySelectorAll("#programs ul > li")].map((l) => getComputedStyle(l).opacity));
  check("[entrance] staggered: each card starts fading in no earlier than the one before", mid.every((v, i) => v !== null && (i === 0 || v >= mid[i - 1])) && mid[2] > mid[0], mid.join(","));
  check("[entrance] all visible at the end", end.every((o) => o === "1"), end.join(","));
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.waitForTimeout(800);
  const again = await p.evaluate(() => [...document.querySelectorAll("#programs ul > li")].map((l) => getComputedStyle(l).opacity));
  check("[entrance] plays once: stays visible after scrolling away", again.every((o) => o === "1"), again.join(","));
  await ctx.close();
}

// reduced motion
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const p = await ctx.newPage();
  await p.goto(base + "/", { waitUntil: "load" });
  await p.waitForTimeout(6500);
  const opac = await p.evaluate(() => [...document.querySelectorAll("#programs ul > li")].map((l) => getComputedStyle(l).opacity));
  check("[reduced] cards fully visible without scrolling, no entrance", opac.every((o) => o === "1"), opac.join(","));
  await p.locator("#programs").scrollIntoViewIfNeeded();
  const running = await p.evaluate(() => document.querySelector("#programs").getAnimations({ subtree: true }).filter((a) => a.playState === "running" && a.effect?.getComputedTiming().iterations === Infinity).length);
  check("[reduced] no infinite animation in the section", running === 0, String(running));
  const card = p.locator("#programs article").nth(1);
  const b4 = await card.evaluate((a) => ({ t: getComputedStyle(a).transform, bc: getComputedStyle(a).borderTopColor, chev: getComputedStyle(a.querySelector("a svg")).translate }));
  await card.hover();
  await p.waitForTimeout(600);
  const af = await card.evaluate((a) => ({ t: getComputedStyle(a).transform, bc: getComputedStyle(a).borderTopColor, chev: getComputedStyle(a.querySelector("a svg")).translate }));
  check("[reduced] hover changes colour only: no lift, no chevron slide", b4.bc !== af.bc && af.t === "none" && (af.chev === "none" || parseFloat(af.chev) === 0), JSON.stringify([b4, af]));
  await ctx.close();
}

// touch: no hover lift on tap
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const p = await ctx.newPage();
  await p.goto(base + "/", { waitUntil: "load" });
  await p.waitForTimeout(6500);
  await p.locator("#programs article").nth(2).scrollIntoViewIfNeeded();
  await p.waitForTimeout(1200);
  const card = p.locator("#programs article").nth(2);
  const box = await card.boundingBox();
  await p.touchscreen.tap(box.x + 20, box.y + 20);
  await p.waitForTimeout(600);
  const t = await card.evaluate((a) => getComputedStyle(a).transform);
  check("[touch] tapping a card does not lift it", t === "none", t);
  await ctx.close();
}

// keyboard: one tab stop per card in visual order, visible focus, lift on focus
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(base + "/", { waitUntil: "load" });
  await p.waitForTimeout(6500);
  const seen = [];
  await p.evaluate(() => document.querySelector("#programs h2").setAttribute("tabindex", "-1"));
  await p.evaluate(() => document.querySelector("#programs h2").focus());
  for (let i = 0; i < 7; i++) {
    await p.keyboard.press("Tab");
    seen.push(await p.evaluate(() => { const e = document.activeElement; const c = e.closest("article"); return c ? c.querySelector("h3").textContent : e.getAttribute("href"); }));
  }
  check("[keyboard] tab visits each card once in order, then the all-programs link", JSON.stringify(seen.slice(0, 3)) === JSON.stringify(titles) && seen[3] === "/programs", JSON.stringify(seen));
  await p.locator("#programs article a").first().focus();
  await p.keyboard.press("Tab"); await p.keyboard.press("Shift+Tab");
  await p.waitForTimeout(600);
  const f = await p.evaluate(() => { const a = document.activeElement; const s = getComputedStyle(a); return { outline: s.outlineStyle, w: s.outlineWidth, lift: getComputedStyle(a.closest("article")).transform }; });
  check("[keyboard] focused CTA has a visible outline and its card lifts", f.outline !== "none" && parseFloat(f.w) >= 2 && f.lift !== "none", JSON.stringify(f));
  await ctx.close();
}

// no JS: everything readable
{
  const ctx = await b.newContext({ viewport: { width: 1024, height: 900 }, javaScriptEnabled: false });
  const p = await ctx.newPage();
  await p.goto(base + "/", { waitUntil: "load" });
  const vis = await p.evaluate(() => [...document.querySelectorAll("#programs ul > li")].map((l) => getComputedStyle(l).opacity));
  check("[no-js] three cards visible", vis.length === 3 && vis.every((o) => o === "1"), vis.join(","));
  await ctx.close();
}

await b.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
