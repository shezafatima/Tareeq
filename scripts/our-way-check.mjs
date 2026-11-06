// Behaviour, layout and state checks for the Our Way page (feature 016). Prints no personal data.
// Usage: npm run build && npx next start -p 3100, then: CHROME=<path> BASE=http://localhost:3100 node scripts/our-way-check.mjs
import { chromium } from "@playwright/test";

const base = process.env.BASE ?? "http://localhost:3100";
const WIDTHS = [360, 390, 768, 1024, 1440];
const b = await chromium.launch({ executablePath: process.env.CHROME });
let pass = 0;
let fail = 0;
const check = (name, ok, detail = "") => {
  ok ? pass++ : fail++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok || !detail ? "" : `  (${detail})`}`);
};

async function open(ctx, path = "/our-way") {
  const p = await ctx.newPage();
  p.errors = [];
  p.on("console", (m) => { if (["error", "warning"].includes(m.type())) p.errors.push(m.text()); });
  p.on("pageerror", (e) => p.errors.push(e.message));
  await p.goto(base + path, { waitUntil: "load" });
  return p;
}
const settle = (p) => p.waitForFunction(() => document.documentElement.getAttribute("data-preloader") !== "run", null, { timeout: 20000 });
const ready = (p) => p.waitForSelector("[data-way-ready]", { state: "attached", timeout: 15000 });
const scrollTo = async (p, y) => {
  await p.evaluate((v) => window.scrollTo({ top: v, behavior: "instant" }), y);
  await p.waitForTimeout(120);
};

/** The visible pieces: how much of each is drawn, from 0 to 1, by its dash values. */
const lineState = (p) =>
  p.evaluate(() =>
    [...document.querySelectorAll("[data-way-seg]")]
      .filter((s) => s.getBoundingClientRect().height > 0)
      .map((s) => {
        const path = s.querySelector("path");
        const dash = parseFloat(path.getAttribute("stroke-dasharray"));
        const off = parseFloat(path.getAttribute("stroke-dashoffset"));
        return Number.isNaN(dash) ? 1 : 1 - (Number.isNaN(off) ? 0 : off) / dash;
      }),
  );
const total = (a) => a.reduce((s, v) => s + v, 0);
const reachedCount = (p) => p.locator("[data-way-node][data-reached]").count();
const dotsFilled = (p) =>
  p.evaluate(() => [...document.querySelectorAll(".way-node-dot")].filter((d) => getComputedStyle(d).opacity === "1").length);

// Same every width: no overlap, no scroll, targets
const overlaps = (p) =>
  p.evaluate(() => {
    const hit = (a, c) => a.left < c.right && c.left < a.right && a.top < c.bottom && c.top < a.bottom;
    const inset = (r) => ({ left: r.left, right: r.right, top: r.top, bottom: r.bottom });
    // the line only: a piece's box is wider than its line under 1024px, and its stroke is at the box's centre
    const pieces = [];
    for (const s of document.querySelectorAll("[data-way-seg]")) {
      const r = s.getBoundingClientRect();
      if (r.height === 0) continue;
      if (s.dataset.waySeg === "cross") pieces.push({ name: "cross", ...inset(r) });
      else pieces.push({ name: s.dataset.waySeg, left: r.left + r.width / 2 - 1, right: r.left + r.width / 2 + 1, top: r.top, bottom: r.bottom });
    }
    for (const n of document.querySelectorAll("[data-way-node]")) pieces.push({ name: "node", ...inset(n.getBoundingClientRect()) });
    const found = [];
    const content = document.querySelectorAll(".way-body h1, .way-body h2, .way-body h3, .way-body p, .way-body a");
    for (const el of content) {
      // the text itself, not its block: blocks can be wider than the words in them
      const range = document.createRange();
      range.selectNodeContents(el);
      for (const r of range.getClientRects()) {
        for (const piece of pieces) if (hit(r, piece)) found.push(`${piece.name} on "${el.textContent.slice(0, 24)}"`);
      }
    }
    return [...new Set(found)];
  });

for (const w of WIDTHS) {
  const tag = `[${w}px]`;
  const c = await b.newContext({ viewport: { width: w, height: 800 } });
  const p = await open(c);
  await settle(p);
  await ready(p);

  check(`${tag} six sections in order`, JSON.stringify(await p.locator("[data-way-page] > section").evaluateAll((s) => s.map((e) => e.id))) === JSON.stringify(["way-opening", "way-problem", "way-principles", "way-session", "way-purpose", "way-closing"]));
  check(`${tag} exactly one h1, the meaning line`, (await p.locator("h1").count()) === 1 && (await p.locator("h1").innerText()) === "Tareeq means 'the way'.");
  check(`${tag} headings do not skip a level`, await p.locator("main").evaluate((m) => {
    let last = 1;
    for (const h of m.querySelectorAll("h1,h2,h3,h4")) {
      const n = Number(h.tagName[1]);
      if (n > last + 1) return false;
      last = n;
    }
    return true;
  }));
  const ur = p.locator('[lang="ur"]');
  check(`${tag} the Urdu word is the only Urdu or right-to-left element`, (await ur.count()) === 1 && (await ur.innerText()) === "طریق" && (await ur.getAttribute("dir")) === "rtl" && (await p.locator("main [dir]").count()) === 1);
  check(`${tag} the manifesto shows`, (await p.locator("main").innerText()).includes("AI is learned by doing, not by watching."));
  check(`${tag} four principles and three steps`, (await p.locator("#way-principles li").count()) === 4 && (await p.locator("#way-session li").count()) === 3);
  check(`${tag} no hype words`, !/empower|unlock|revolutioni[sz]e/i.test(await p.locator("main").innerText()));

  const noScroll = () => p.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
  check(`${tag} no horizontal scroll at the top`, await noScroll());
  const bad = await overlaps(p);
  check(`${tag} the line and markers overlap no text or control`, bad.length === 0, bad.slice(0, 4).join("; "));

  const small = await p.locator("[data-way-page] a").evaluateAll((a) => a.filter((e) => e.getBoundingClientRect().height < 44).map((e) => e.textContent));
  check(`${tag} closing links are at least 44px tall`, small.length === 0, small.join(", "));

  const layout = await p.evaluate(() => {
    const shown = (sel) => [...document.querySelectorAll(sel)].filter((s) => s.getBoundingClientRect().height > 0).length;
    const xs = [...document.querySelectorAll("[data-way-node]")].map((n) => { const r = n.getBoundingClientRect(); return Math.round(r.left + r.width / 2); });
    return { straight: shown(".way-seg--straight"), rail: shown(".way-seg--rail"), cross: shown(".way-seg--cross"), xs };
  });
  if (w < 1024) {
    check(`${tag} a straight line in every section`, layout.straight === 6 && layout.rail === 0 && layout.cross === 0, JSON.stringify(layout));
    check(`${tag} every marker on one line at the left`, new Set(layout.xs).size === 1 && layout.xs[0] < 48, layout.xs.join());
    const beside = await p.evaluate(() => [...document.querySelectorAll("[data-way-page] > section")].slice(1).every((s) => {
      const n = s.querySelector("[data-way-node]").getBoundingClientRect();
      const h = s.querySelector("h2").getBoundingClientRect();
      return n.top < h.bottom && h.top < n.bottom;
    }));
    check(`${tag} markers sit beside their headings`, beside);
  } else {
    check(`${tag} rails and five crossings`, layout.rail === 6 && layout.cross === 5 && layout.straight === 0, JSON.stringify(layout));
    check(`${tag} markers alternate left and right`, layout.xs[0] < w / 2 && layout.xs[1] > w / 2 && layout.xs[2] < w / 2 && layout.xs[3] > w / 2 && layout.xs[4] < w / 2 && layout.xs[5] > w / 2, layout.xs.join());
    const joins = await p.evaluate(() => {
      const pieces = [...document.querySelectorAll("[data-way-seg]")].filter((s) => s.getBoundingClientRect().height > 0);
      const gaps = [];
      for (let i = 0; i < pieces.length - 1; i++) gaps.push(Math.abs(pieces[i].getBoundingClientRect().bottom - pieces[i + 1].getBoundingClientRect().top));
      return Math.max(...gaps);
    });
    check(`${tag} every piece joins the next with no gap`, joins < 1.5, String(joins));
    const ends = await p.evaluate(() => {
      const rail = (s) => { const r = s.getBoundingClientRect(); return r.left + r.width / 2; };
      const rails = [...document.querySelectorAll(".way-seg--rail")];
      const crosses = [...document.querySelectorAll(".way-seg--cross")];
      return crosses.every((c, i) => {
        const r = c.getBoundingClientRect();
        const from = c.dataset.from === "left" ? r.left : r.right;
        const to = c.dataset.from === "left" ? r.right : r.left;
        return Math.abs(rail(rails[i]) - from) < 1.5 && Math.abs(rail(rails[i + 1]) - to) < 1.5;
      });
    });
    check(`${tag} crossings meet the rails above and below`, ends);
  }

  // Drawing
  const first = await lineState(p);
  check(`${tag} at the top the line has only begun`, total(first) > 0 && total(first) < first.length / 2, first.join());
  const max = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  await scrollTo(p, max * 0.5);
  const mid = await lineState(p);
  check(`${tag} scrolling down draws more`, total(mid) > total(first));
  check(`${tag} no horizontal scroll partway`, await noScroll());
  const midReached = await reachedCount(p);
  check(`${tag} markers fill as sections arrive, not all at once`, midReached >= 2 && midReached < 6, String(midReached));
  await scrollTo(p, max * 0.2);
  const back = await lineState(p);
  check(`${tag} scrolling back shortens the line`, total(back) < total(mid));
  check(`${tag} markers stay filled going back`, (await reachedCount(p)) === midReached);
  await scrollTo(p, max);
  const end = await lineState(p);
  check(`${tag} complete at the bottom of the page`, end.every((v) => v > 0.995), end.join());
  check(`${tag} six of six markers at the bottom`, (await reachedCount(p)) === 6);
  await scrollTo(p, 0);
  check(`${tag} a jump to the top leaves a short line`, Math.abs(total(await lineState(p)) - total(first)) < 0.01);

  await p.waitForTimeout(w === 1440 ? 4000 : 0); // a preload that goes unused only warns after a few seconds
  check(`${tag} no console errors or warnings`, p.errors.length === 0, p.errors.slice(0, 2).join(" | "));
  await c.close();
}

// Tall window: the line must still finish
{
  const c = await b.newContext({ viewport: { width: 1440, height: 1800 } });
  const p = await open(c);
  await settle(p);
  await ready(p);
  await scrollTo(p, await p.evaluate(() => document.documentElement.scrollHeight - innerHeight));
  check("[1440x1800] complete at the bottom", (await lineState(p)).every((v) => v > 0.995) && (await reachedCount(p)) === 6);
  await c.close();
}

// Reload partway: correct on arrival, with no replay
for (const w of [390, 1440]) {
  const c = await b.newContext({ viewport: { width: w, height: 800 } });
  const p = await open(c);
  await settle(p);
  await ready(p);
  const max = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  await scrollTo(p, max * 0.6);
  const before = await lineState(p);
  await p.evaluate(() => { history.scrollRestoration = "auto"; });
  await p.reload({ waitUntil: "load" });
  await ready(p);
  await p.waitForTimeout(200);
  const y = await p.evaluate(() => scrollY);
  check(`[${w}px] reload keeps the position`, y > 0, String(y));
  const after = await lineState(p);
  check(`[${w}px] reload draws to the same place`, Math.abs(total(after) - total(before)) < 0.05, `${total(before)} vs ${total(after)}`);
  check(`[${w}px] passed markers are filled at once`, (await reachedCount(p)) >= 2);
  await c.close();
}

// Resize across the desktop boundary
{
  const c = await b.newContext({ viewport: { width: 1440, height: 800 } });
  const p = await open(c);
  await settle(p);
  await ready(p);
  await scrollTo(p, 1500);
  const before = await reachedCount(p);
  await p.setViewportSize({ width: 390, height: 800 });
  await p.waitForTimeout(300);
  const state = await lineState(p);
  check("[1440 to 390] the straight line takes over", state.length === 6 && total(state) > 0);
  check("[1440 to 390] no horizontal scroll", await p.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
  check("[1440 to 390] markers kept", (await reachedCount(p)) >= before);
  await p.setViewportSize({ width: 1440, height: 800 });
  await p.waitForTimeout(300);
  check("[390 to 1440] the weave returns", (await lineState(p)).length === 11);
  const fits = await p.evaluate(() => [...document.querySelectorAll("[data-way-seg]")].filter((s) => s.getBoundingClientRect().height > 0).every((s) => {
    const r = s.getBoundingClientRect();
    const vb = s.viewBox.baseVal;
    return Math.abs(vb.width - r.width) < 1 && Math.abs(vb.height - r.height) < 1;
  }));
  check("[390 to 1440] pieces are refitted to their new size", fits);
  await c.close();
}

// Reduced motion and no scripts: complete, static, at first paint
for (const [name, opts] of [["reduced motion", { reducedMotion: "reduce" }], ["no scripts", { javaScriptEnabled: false }]]) {
  for (const w of [360, 1440]) {
    const tag = `[${w}px ${name}]`;
    const c = await b.newContext({ viewport: { width: w, height: 800 }, ...opts });
    const p = await c.newPage();
    await p.goto(base + "/our-way", { waitUntil: "commit" });
    await p.waitForSelector("[data-way-node]", { state: "attached" });
    await p.waitForLoadState("load");
    const look = () => p.evaluate(() => ({
      dots: [...document.querySelectorAll(".way-node-dot")].filter((d) => getComputedStyle(d).opacity === "1").length,
      hidden: [...document.querySelectorAll(".way-seg")].filter((s) => getComputedStyle(s).opacity !== "1").length,
      dashed: document.querySelectorAll(".way-seg path[stroke-dasharray]").length,
      ready: document.querySelectorAll("[data-way-ready]").length,
      content: [...document.querySelectorAll("[data-way-page] h2")].every((h) => h.getBoundingClientRect().height > 0),
    }));
    const s = await look();
    check(`${tag} all markers filled, no piece hidden, no drawing running`, s.dots === 6 && s.hidden === 0 && s.dashed === 0 && s.ready === 0, JSON.stringify(s));
    await p.evaluate(() => { window.scrollTo(0, 1500); }).catch(() => {});
    check(`${tag} still complete after scrolling`, JSON.stringify(await look()) === JSON.stringify(s));
    const bad = await overlaps(p);
    check(`${tag} no overlap with text or controls`, bad.length === 0, bad.slice(0, 4).join("; "));
    check(`${tag} no horizontal scroll`, await p.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
    if (name === "no scripts") check(`${tag} all content shows`, (await p.locator("main").innerText()).includes("Take the next step"));
    await c.close();
  }
}

// Reduced motion, section entrances
{
  const c = await b.newContext({ viewport: { width: 390, height: 800 }, reducedMotion: "reduce" });
  const p = await open(c);
  await p.waitForTimeout(800);
  const hidden = await p.evaluate(() => [...document.querySelectorAll("[data-way-page] [data-reveal]")].filter((e) => { const s = getComputedStyle(e); return s.opacity !== "1" || s.transform !== "none"; }).length);
  check("[reduced motion] no entrance hides or moves anything", hidden === 0, String(hidden));
  await c.close();
}

// Decoration: not focusable, not exposed, not clickable
{
  const c = await b.newContext({ viewport: { width: 1440, height: 800 } });
  const p = await open(c);
  await settle(p);
  const deco = await p.evaluate(() => {
    const all = [...document.querySelectorAll(".way-track, .way-node")];
    return {
      hidden: all.every((e) => e.getAttribute("aria-hidden") === "true"),
      inert: all.every((e) => getComputedStyle(e).pointerEvents === "none"),
      focusable: document.querySelectorAll(".way-track [tabindex], .way-track a, .way-node a, .way-node [tabindex]").length,
    };
  });
  check("[decoration] hidden from assistive technology", deco.hidden);
  check("[decoration] cannot take clicks or taps", deco.inert);
  check("[decoration] nothing focusable", deco.focusable === 0);
  await c.close();
}

// Links
for (const w of [390, 1440]) {
  const c = await b.newContext({ viewport: { width: w, height: 800 } });
  let p = await open(c);
  await settle(p);
  await p.locator("#way-closing a", { hasText: "Meet your mentor" }).click();
  await p.waitForURL(/\/#mentor$/, { timeout: 15000 });
  await p.waitForTimeout(1200);
  const top = await p.locator("#mentor-title").evaluate((e) => e.getBoundingClientRect().top);
  const header = await p.locator("header").first().evaluate((e) => e.getBoundingClientRect().bottom);
  check(`[${w}px] Meet your mentor lands on the mentor heading, clear of the header`, top >= header && top < 800, `${top} vs ${header}`);
  p = await open(c);
  await settle(p);
  await p.locator("#way-closing a", { hasText: "Book a workshop" }).click();
  await p.waitForURL(/\/workshop\?book=1$/, { timeout: 15000 });
  await p.locator('[role="dialog"]').first().waitFor({ timeout: 15000 });
  check(`[${w}px] Book a workshop opens the booking form`, true);
  await c.close();
}

// Going away and back: no errors, drawing still works
{
  const c = await b.newContext({ viewport: { width: 1440, height: 800 } });
  const p = await open(c);
  await settle(p);
  await ready(p);
  await p.locator('header a[href="/programs"]').first().click();
  await p.waitForURL(/\/programs$/);
  await p.goBack();
  await ready(p);
  await scrollTo(p, await p.evaluate(() => document.documentElement.scrollHeight - innerHeight));
  check("[back button] drawing still works", (await lineState(p)).every((v) => v > 0.995));
  check("[back button] no console errors or warnings", p.errors.length === 0, p.errors.slice(0, 2).join(" | "));
  await c.close();
}

// The font, the head, and the nav
{
  const c = await b.newContext({ viewport: { width: 390, height: 800 } });
  const p = await c.newPage();
  const fonts = [];
  p.on("response", async (r) => {
    if (/\.woff2/.test(r.url())) fonts.push({ url: r.url(), size: (await r.body().catch(() => Buffer.alloc(0))).length });
  });
  await p.goto(base + "/our-way", { waitUntil: "networkidle" });
  await p.waitForTimeout(300);
  const applied = await p.locator('[lang="ur"]').evaluate(async (e) => {
    await document.fonts.ready;
    const family = getComputedStyle(e).fontFamily.split(",")[0].trim().replace(/"/g, "");
    return document.fonts.check(`700 100px "${family}"`, e.textContent) && [...document.fonts].some((f) => f.family.replace(/"/g, "") === family && f.status === "loaded");
  });
  check("[font] the word uses the loaded Nastaliq font", applied);
  const widthOk = await p.locator('[lang="ur"]').evaluate((e) => {
    const r = document.createRange();
    r.selectNodeContents(e);
    return r.getBoundingClientRect().width / parseFloat(getComputedStyle(e).fontSize);
  });
  check("[font] the word is shaped as Nastaliq, not flat", widthOk > 1.9 && widthOk < 2.25, String(widthOk));
  const small = fonts.filter((f) => f.size > 5000 && f.size < 20000).length;
  check("[font] one small Urdu file of about 11 KB", small === 1, JSON.stringify(fonts.map((f) => f.size)));
  const countOn = async (path) => {
    const q = await c.newPage();
    const seen = [];
    q.on("response", async (r) => { if (/\.woff2/.test(r.url())) seen.push((await r.body().catch(() => Buffer.alloc(0))).length); });
    await q.goto(base + path, { waitUntil: "load" });
    await q.waitForTimeout(800);
    await q.close();
    return seen;
  };
  const urduSize = fonts.find((f) => f.size > 5000 && f.size < 20000)?.size;
  check("[font] not loaded on the home page", !(await countOn("/")).includes(urduSize));
  check("[font] not loaded on Programs", !(await countOn("/programs")).includes(urduSize));
  const nav = await c.newPage();
  const warned = [];
  nav.on("console", (m) => { if (m.type() === "warning") warned.push(m.text()); });
  await nav.goto(base + "/", { waitUntil: "load" });
  await nav.waitForTimeout(5000);
  check("[font] other pages get no unused-preload warning from this route", warned.length === 0, warned.slice(0, 1).join(""));
  await nav.close();

  check("[head] title", /^Our Way/.test(await p.title()));
  const meta = (sel) => p.locator(sel).first().getAttribute("content");
  check("[head] description is this page's", /how we teach/.test(await meta('meta[name="description"]')));
  check("[head] Open Graph title and description", /^Our Way/.test(await meta('meta[property="og:title"]')) && /how we teach/.test(await meta('meta[property="og:description"]')));
  check("[head] Open Graph url and image", /\/our-way$/.test(await meta('meta[property="og:url"]')) && /robot\.png/.test(await meta('meta[property="og:image"]')));
  check("[head] canonical", /\/our-way$/.test(await p.locator('link[rel="canonical"]').getAttribute("href")));
  await c.close();
}

await b.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
