// Feature 005 checks: robot and cards travel into "How it works", carousel, swipe, list fallbacks.
// Usage: CHROME=<path> BASE=http://localhost:3100 node scripts/robot-travel-check.mjs [group]
//   groups: handoff | travel | a11y | edge | list | carousel | robot | swipe | widths   (default: all)
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const base = process.env.BASE ?? "http://localhost:3100";
const only = process.argv[2];
const want = (g) => !only || only === g;
mkdirSync("shots/005", { recursive: true });
const b = await chromium.launch({ executablePath: process.env.CHROME });
const results = [];
const check = (name, ok, extra = "") => results.push(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  (" + extra + ")" : ""}`);
const near = (a, c, t) => Math.abs(a - c) <= t;

const CLS_INIT = () => {
  window.__cls = 0;
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
  }).observe({ type: "layout-shift", buffered: true });
};
const waitPreloader = async (p) => {
  await p.waitForFunction(() => document.documentElement.getAttribute("data-preloader") !== "run", null, { timeout: 25000, polling: 100 });
  await p.waitForTimeout(1200);
};
const instantScroll = (p) => p.addStyleTag({ content: "html{scroll-behavior:auto!important}" });
const scrollTo = async (p, y, wait = 120) => {
  await p.evaluate((v) => window.scrollTo(0, v), y);
  await p.waitForTimeout(wait);
};
// State of the robots and cards in the page
const state = () => {
  const vis = (el) => {
    if (!el) return false;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return cs.visibility !== "hidden" && Number(cs.opacity) > 0.01 && r.width > 0 && r.bottom > 0 && r.top < innerHeight;
  };
  const rect = (el) => {
    const r = el.getBoundingClientRect();
    return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width, h: r.height, top: r.top, bottom: r.bottom };
  };
  const heroRoot = document.querySelector("main").firstElementChild;
  const heroImg = heroRoot.querySelector('img[alt="Tareeq robot assistant"]');
  const heroLayer = heroImg.closest(".absolute");
  const twin = document.querySelector(".hiw-twin");
  // the twin shows its normal image, or (once turned to face the cards) the chevron-free one
  const twinImg = twin ? [...twin.querySelectorAll('img[alt="Tareeq robot assistant"], img[src*="nochevron"]')].find((i) => getComputedStyle(i).visibility !== "hidden") ?? twin.querySelector("img") : null;
  const heroCards = ["prompt", "build", "learn"].map((id) => heroRoot.querySelector(`[data-hero-card="${id}"]`));
  const cards = [...document.querySelectorAll(".hiw-card")];
  const robotsVisible = [heroLayer && vis(heroImg) && getComputedStyle(heroLayer).visibility !== "hidden", twin && vis(twinImg)].filter(Boolean).length;
  const visibleEl = (el) => {
    let e = el;
    while (e) {
      if (getComputedStyle(e).visibility === "hidden" || Number(getComputedStyle(e).opacity) < 0.01) return false;
      e = e.parentElement;
    }
    return true;
  };
  return {
    scrollY: Math.round(scrollY),
    heroHidden: heroLayer.hasAttribute("inert") && getComputedStyle(heroLayer).visibility === "hidden",
    heroCardsHidden: heroCards.every((c) => c.hasAttribute("inert") && getComputedStyle(c).visibility === "hidden"),
    heroCardsClean: heroCards.every((c) => !c.hasAttribute("inert") && !c.hasAttribute("aria-hidden") && c.style.visibility === ""),
    heroLayerClean: !heroLayer.hasAttribute("inert") && heroLayer.style.visibility === "",
    twinInert: twin ? twin.hasAttribute("inert") : null,
    twinVisible: twin ? getComputedStyle(twin).visibility !== "hidden" : false,
    robotsVisible,
    heroImg: rect(heroImg),
    twinImg: twinImg ? rect(twinImg) : null,
    heroCards: heroCards.map((c) => rect(c.querySelector(".backdrop-blur-md") ?? c)),
    compact: cards.map((c) => rect(c.querySelector(".hiw-face-compact > div"))),
    compactShown: cards.map((c) => visibleEl(c.querySelector(".hiw-face-compact > div"))),
    arrived: document.querySelector(".hiw")?.hasAttribute("data-arrived"),
    stageTop: document.querySelector(".hiw-stage")?.getBoundingClientRect().top,
    header: document.querySelector("header").getBoundingClientRect().height,
    pos: cards.map((c) => c.getAttribute("data-pos")),
    hscroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  };
};

// ---------- hand-off gate (1440x900) ----------
if (want("handoff")) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.goto(base + "/", { waitUntil: "load" });
  await waitPreloader(p);
  await instantScroll(p);
  await scrollTo(p, 0, 400);
  const s0 = await p.evaluate(state);
  check("[handoff] at scroll 0 the hero is untouched (no inline visibility, no inert) and the twin is hidden and inert", s0.heroLayerClean && s0.heroCardsClean && !s0.twinVisible && s0.twinInert === true && s0.robotsVisible === 1, JSON.stringify({ robots: s0.robotsVisible, twinInert: s0.twinInert }));
  const clip = { x: 680, y: 150, width: 720, height: 700 };
  await p.screenshot({ path: "shots/005/handoff-before.png", clip });
  for (const y of [1, 3]) {
    await scrollTo(p, y, 250);
    const s = await p.evaluate(state);
    const r = s.twinImg;
    const h = s.heroImg;
    check(`[handoff] ${y}px: twin robot exactly on the hero robot (centre and width within 1px)`, r && near(r.cx, h.cx, 1) && near(r.cy, h.cy, 1) && near(r.w, h.w, 1), r ? `dx ${(r.cx - h.cx).toFixed(2)} dy ${(r.cy - h.cy).toFixed(2)} dw ${(r.w - h.w).toFixed(2)}` : "no twin");
    check(`[handoff] ${y}px: each card's compact face on its hero card (centre within 3px, width within 6px)`, s.compact.every((c, i) => near(c.cx, s.heroCards[i].cx, 3) && near(c.cy, s.heroCards[i].cy, 3) && near(c.w, s.heroCards[i].w, 6)), s.compact.map((c, i) => `${(c.cx - s.heroCards[i].cx).toFixed(1)},${(c.cy - s.heroCards[i].cy).toFixed(1)}`).join(" "));
    const rot = await p.evaluate(() => getComputedStyle(document.querySelector(".hiw-twin")).transform);
    check(`[handoff] ${y}px: the twin has not started turning (no rotation)`, !/matrix3d/.test(rot), rot.slice(0, 40));
    check(`[handoff] ${y}px: hero robot and cards hidden (visibility hidden + inert), twin shown, exactly one robot visible`, s.heroHidden && s.heroCardsHidden && s.twinVisible && s.twinInert === false && s.robotsVisible === 1, JSON.stringify({ robots: s.robotsVisible }));
    await p.screenshot({ path: `shots/005/handoff-${y === 1 ? "during" : "after"}.png`, clip });
  }
  for (const y of [20, 200]) {
    await scrollTo(p, y, 200);
    const s = await p.evaluate(state);
    check(`[handoff] ${y}px: exactly one robot visible`, s.robotsVisible === 1, String(s.robotsVisible));
  }
  await scrollTo(p, 0, 400);
  const back = await p.evaluate(state);
  check("[handoff] back at 0: hero restored exactly (no attributes left), twin hidden", back.heroLayerClean && back.heroCardsClean && !back.twinVisible && back.robotsVisible === 1);
  await ctx.close();
}

// ---------- list layout: reduced motion and no JavaScript ----------
if (want("list")) {
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    for (const mode of ["reduced", "nojs"]) {
      const ctx = await b.newContext({ viewport: { width: w, height: h }, ...(mode === "reduced" ? { reducedMotion: "reduce" } : { javaScriptEnabled: false }) });
      const p = await ctx.newPage();
      await p.goto(base + "/", { waitUntil: "load" });
      await p.waitForTimeout(800);
      const info = await p.evaluate(() => {
        const sec = document.querySelector("#how-it-works");
        const cards = [...sec.querySelectorAll(".hiw-card")];
        const full = cards.map((c) => c.querySelector(".hiw-face-full"));
        const robot = sec.querySelector(".hiw-robot-static");
        const m = robot ? new DOMMatrixReadOnly(getComputedStyle(robot).transform) : null;
        return {
          n: cards.length,
          texts: full.map((f) => [f.querySelector("h3")?.textContent, f.querySelector("p")?.textContent?.length ?? 0]),
          allVisible: full.every((f) => { const r = f.getBoundingClientRect(); return r.width > 50 && getComputedStyle(f).visibility !== "hidden" && Number(getComputedStyle(f).opacity) === 1; }),
          controls: getComputedStyle(sec.querySelector(".hiw-controls")).display,
          region: !!sec.querySelector('[aria-roledescription="carousel"]'),
          robotShown: robot ? getComputedStyle(robot).display !== "none" && robot.getBoundingClientRect().width > 50 : false,
          mirrored: m ? m.a < 0 : false,
          sectionH: Math.round(sec.getBoundingClientRect().height),
          hscroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        };
      });
      check(`[list ${mode} ${w}] three steps visible with heading and body, no carousel controls or roles, static robot shown and not mirrored`, info.n === 3 && info.allVisible && info.texts.every(([h, len]) => h && len > 40) && info.controls === "none" && !info.region && info.robotShown && !info.mirrored && !info.hscroll, JSON.stringify({ controls: info.controls, region: info.region, robot: info.robotShown, h: info.sectionH }));
      await p.locator("#how-it-works").scrollIntoViewIfNeeded();
      await p.waitForTimeout(300);
      await p.screenshot({ path: `shots/005/list-${mode}-${w}.png` });
      await ctx.close();
    }
  }
}

// ---------- travel: mid-travel, arrival at sticky engagement, runway, release, reverse ----------
if (want("travel")) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.addInitScript(CLS_INIT);
  await p.goto(base + "/", { waitUntil: "load" });
  await waitPreloader(p);
  await instantScroll(p);
  const geo = await p.evaluate(() => { const st = document.querySelector(".hiw-stage"); const hd = document.querySelector("header").getBoundingClientRect().height; const top = document.querySelector(".hiw").getBoundingClientRect().top + scrollY; return { sticky: Math.round(top - hd), early: st.offsetHeight * 0.35, stageH: st.offsetHeight }; });
  const range = Math.round(geo.sticky - geo.early);
  const s0 = await p.evaluate(state);
  for (const [name, f] of [["0-top", 0], ["1-25", 0.25], ["2-mid", 0.5], ["3-75", 0.75], ["4-99", 0.99]]) {
    await scrollTo(p, Math.round(range * f), 250);
    await p.screenshot({ path: `shots/005/seq-${name}.png` });
  }
  const mid = await (async () => { await scrollTo(p, Math.round(range * 0.4), 250); return p.evaluate(state); })(); // not 0.5: the half-turn is edge-on there
  check("[travel] mid-travel: one robot visible, hero hidden, not arrived", mid.robotsVisible === 1 && mid.heroHidden && !mid.arrived);
  await scrollTo(p, range + 2, 900);
  const at = await p.evaluate(state);
  await p.screenshot({ path: "shots/005/seq-5-settled.png" });
  check("[travel] arrival comes before the stage sticks (shorter scroll gap) and the cards fan out", near(at.stageTop, at.header + geo.early, 3) && at.arrived && at.pos.includes("center") && at.pos.includes("left") && at.pos.includes("right"), JSON.stringify({ top: at.stageTop, expect: at.header + geo.early, pos: at.pos }));
  const turn = await p.evaluate(() => { const t = document.querySelector(".hiw-twin"); const m = new DOMMatrixReadOnly(getComputedStyle(t).transform); const chev = t.querySelector('img[src*="robot-chevron"]'); const base = t.querySelector('img[alt="Tareeq robot assistant"]'); return { a: m.a, chevronShown: getComputedStyle(chev).visibility === "visible", chevronFlip: new DOMMatrixReadOnly(getComputedStyle(chev).transform).a, baseHidden: getComputedStyle(base).visibility === "hidden" }; });
  check("[travel] on arrival the robot has turned to face the cards, with the chevron laid back on top pointing the right way", turn.a < 0 && turn.chevronShown && turn.chevronFlip < 0 && turn.baseHidden, JSON.stringify(turn));
  await scrollTo(p, geo.sticky + 2, 600);
  const st2 = await p.evaluate(state);
  check("[travel] once the stage sticks, the robot is fully in view", st2.twinImg && st2.twinImg.top >= st2.header - 1 && st2.twinImg.bottom <= 900 && near(st2.stageTop, st2.header, 1.5), JSON.stringify({ img: st2.twinImg, stageTop: st2.stageTop }));
  const runway = await p.evaluate(() => document.querySelector(".hiw").getBoundingClientRect().height - document.querySelector(".hiw-stage").getBoundingClientRect().height);
  let inView = true;
  for (let y = geo.sticky; y < geo.sticky + runway - 10; y += 120) {
    await scrollTo(p, y, 60);
    const s = await p.evaluate(state);
    if (!(s.twinImg && s.twinImg.top >= s.header - 1 && s.twinImg.bottom <= 901)) inView = false;
  }
  check("[travel] across the reading runway the robot stays fully in view", inView, `runway ${Math.round(runway)}px`);
  await scrollTo(p, geo.sticky + runway + 500, 300);
  const after = await p.evaluate(state);
  check("[travel] after the section ends the robot scrolls away (released)", after.twinImg && after.twinImg.bottom < 900 && after.stageTop < after.header - 100, JSON.stringify({ stageTop: after.stageTop }));
  // reverse to the top in 20px steps
  let worst = 0;
  let prev = null;
  for (let y = range; y >= 0; y -= 20) {
    await scrollTo(p, y, 25);
    await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    const s = await p.evaluate(state);
    if (prev && s.twinImg && prev.twinImg) worst = Math.max(worst, Math.abs(s.twinImg.cy - prev.twinImg.cy + (prev.y - y)) > 0 ? Math.abs(s.twinImg.cy - prev.twinImg.cy - (prev.y - y)) : 0);
    prev = { y, twinImg: s.twinImg };
  }
  await scrollTo(p, 0, 500);
  const back = await p.evaluate(state);
  check("[travel] back at the top: hero restored, twin hidden, hero robot where it started (within 1px)", back.heroLayerClean && back.heroCardsClean && !back.twinVisible && near(back.heroImg.cx, s0.heroImg.cx, 1) && near(back.heroImg.cy, s0.heroImg.cy, 1));
  check("[travel] reverse is smooth (no step jump beyond 60px per 20px of scroll)", worst < 60, `worst ${worst.toFixed(1)}px`);
  const cls = await p.evaluate(() => window.__cls);
  check("[travel] layout shift through the whole run at or below 0.05", cls <= 0.05, cls.toFixed(4));
  await ctx.close();
}

// ---------- a11y while scrolled: nothing hidden is focusable or announced ----------
if (want("a11y")) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(base + "/", { waitUntil: "load" });
  await waitPreloader(p);
  await instantScroll(p);
  const range = await p.evaluate(() => Math.round(document.querySelector(".hiw").getBoundingClientRect().top + scrollY - document.querySelector("header").getBoundingClientRect().height));
  await scrollTo(p, 0, 300);
  check("[a11y] at the top the hero card 'Prompt' is in the accessibility tree", (await p.getByRole("group", { name: "Prompt", exact: true }).count()) === 1);
  for (const f of [0.25, 0.6]) {
    await scrollTo(p, Math.round(range * f), 300);
    check(`[a11y] ${Math.round(f * 100)}% of travel: hidden hero cards are not in the accessibility tree`, (await p.getByRole("group", { name: "Prompt", exact: true }).count()) === 0);
    // tab through the whole page from the top of the document, without scrolling back
    await p.evaluate(() => document.activeElement?.blur());
    await p.evaluate(() => { const a = document.createElement("a"); a.href = "#"; a.id = "__start"; document.body.prepend(a); a.focus({ preventScroll: true }); });
    const bad = [];
    for (let i = 0; i < 45; i++) {
      await p.keyboard.press("Tab");
      const r = await p.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        let e = el, hidden = false;
        while (e) { if (e.hasAttribute?.("inert") || getComputedStyle(e).visibility === "hidden") hidden = true; e = e.parentElement; }
        return { hidden, text: (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 24) };
      });
      if (r?.hidden) bad.push(r.text);
    }
    await p.evaluate(() => document.getElementById("__start")?.remove());
    check(`[a11y] ${Math.round(f * 100)}% of travel: Tab never lands on a hidden or inert element`, bad.length === 0, bad.join(" | "));
    await scrollTo(p, Math.round(range * f), 200);
  }
  await ctx.close();
}

// ---------- edge cases ----------
if (want("edge")) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  const fetched = [];
  p.on("response", (r) => { if (/robot-noeyes\.png/.test(decodeURIComponent(r.url()))) fetched.push(r.status()); });
  await p.goto(base + "/", { waitUntil: "load" });
  await waitPreloader(p);
  check("[edge] the robot image is downloaded once (the twin reuses the hero's file)", fetched.length === 1, fetched.join(","));
  await instantScroll(p);
  const range = await p.evaluate(() => Math.round(document.querySelector(".hiw").getBoundingClientRect().top + scrollY - document.querySelector("header").getBoundingClientRect().height));
  await scrollTo(p, range + 300, 300);
  await p.reload({ waitUntil: "load" });
  await waitPreloader(p);
  await instantScroll(p);
  await p.waitForTimeout(800);
  const r1 = await p.evaluate(state);
  check("[edge] reload inside the runway: arrived, coverflow shown, one robot, hero hidden", r1.arrived && r1.robotsVisible === 1 && r1.heroHidden && r1.pos.includes("center"), JSON.stringify({ y: r1.scrollY, arrived: r1.arrived, robots: r1.robotsVisible }));
  await p.keyboard.press("End");
  await p.waitForTimeout(600);
  await p.keyboard.press("Home");
  await p.waitForTimeout(800);
  const r2 = await p.evaluate(state);
  check("[edge] End then Home: hero restored, twin hidden", r2.heroLayerClean && r2.heroCardsClean && !r2.twinVisible && r2.robotsVisible === 1);
  await scrollTo(p, Math.round(range * 0.5), 300);
  await p.setViewportSize({ width: 900, height: 900 });
  await p.waitForTimeout(700);
  const r3 = await p.evaluate(state);
  check("[edge] resized below 1024 mid-travel: hero given back (no attributes), no twin", r3.heroLayerClean && r3.heroCardsClean && r3.twinInert === null);
  await p.setViewportSize({ width: 1440, height: 900 });
  await p.waitForTimeout(700);
  await scrollTo(p, 0, 400);
  const r4 = await p.evaluate(state);
  check("[edge] back to 1440 at the top: hero untouched, twin hidden", r4.heroLayerClean && r4.heroCardsClean && !r4.twinVisible && r4.robotsVisible === 1);
  const mirrored = await p.evaluate(() => [...document.querySelectorAll('img[alt="Tareeq robot assistant"]')].some((img) => { let e = img; while (e) { const m = new DOMMatrixReadOnly(getComputedStyle(e).transform); if (m.a < 0) return true; e = e.parentElement; } return false; }));
  check("[edge] no robot image is mirrored anywhere", !mirrored);
  await ctx.close();
}

// ---------- carousel (1440) ----------
if (want("carousel")) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(base + "/", { waitUntil: "load" });
  await waitPreloader(p);
  await instantScroll(p);
  const range = await p.evaluate(() => Math.round(document.querySelector(".hiw").getBoundingClientRect().top + scrollY - document.querySelector("header").getBoundingClientRect().height));
  await scrollTo(p, range + 2, 1200);
  await p.mouse.move(5, 450);
  const activeIdx = () => p.evaluate(() => [...document.querySelectorAll('.hiw-controls button[aria-label^="Show step"]')].findIndex((d) => d.getAttribute("aria-current") === "true"));
  const t0 = await activeIdx();
  await p.screenshot({ path: `shots/005/carousel-${t0 + 1}.png` });
  const seq = [t0];
  for (let k = 0; k < 2; k++) {
    await p.waitForTimeout(4300);
    seq.push(await activeIdx());
    await p.waitForTimeout(700);
    await p.screenshot({ path: `shots/005/carousel-${seq.at(-1) + 1}.png` });
  }
  check("[carousel] autoplay advances one card about every 4 s through all three", seq.join(",") === `${t0},${(t0 + 1) % 3},${(t0 + 2) % 3}`, seq.join(","));
  const struct = await p.evaluate(async () => {
    // measure between changes, once the coverflow transitions have finished
    for (let i = 0; i < 40 && document.getAnimations().some((a) => a.effect?.target?.classList?.contains("hiw-card-pose")); i++) await new Promise((r) => setTimeout(r, 50));
    const cards = [...document.querySelectorAll(".hiw-card")];
    const c = cards.find((x) => x.getAttribute("data-pos") === "center");
    const sides = cards.filter((x) => x !== c);
    return { region: !!document.querySelector('[aria-roledescription="carousel"]'), centreOpacity: Number(getComputedStyle(c.querySelector(".hiw-card-pose")).opacity), sidesHidden: sides.every((s) => s.hasAttribute("inert") && s.getAttribute("aria-hidden") === "true"), sideOpacity: sides.map((s) => Number(getComputedStyle(s.querySelector(".hiw-card-pose")).opacity)) };
  });
  check("[carousel] coverflow: one readable centre card, the two side cards dimmed, inert and hidden from assistive technology", struct.region && struct.centreOpacity === 1 && struct.sidesHidden && struct.sideOpacity.every((o) => o < 0.7), JSON.stringify(struct));
  // hover pauses
  const box = await p.locator(".hiw-track").boundingBox();
  await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 3 });
  const h0 = await activeIdx();
  await p.waitForTimeout(6000);
  check("[carousel] paused while hovered (6 s)", (await activeIdx()) === h0);
  await p.mouse.move(5, 450);
  await p.waitForTimeout(5500);
  check("[carousel] resumes after the pointer leaves", (await activeIdx()) !== h0);
  // hidden tab pauses
  const v0 = await activeIdx();
  await p.evaluate(() => { Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" }); document.dispatchEvent(new Event("visibilitychange")); });
  await p.waitForTimeout(6000);
  const v1 = await activeIdx();
  await p.evaluate(() => { Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" }); document.dispatchEvent(new Event("visibilitychange")); });
  check("[carousel] paused while the tab is hidden, no catch-up", v1 === v0);
  // out of view pauses
  const runway = await p.evaluate(() => document.querySelector(".hiw").getBoundingClientRect().height);
  await scrollTo(p, range + runway + 900, 300);
  const o0 = await activeIdx();
  await p.waitForTimeout(6000);
  const o1 = await activeIdx();
  check("[carousel] paused while the section is out of view", o1 === o0);
  await scrollTo(p, range + 2, 800);
  // focus pauses, keys move, interaction stops autoplay
  await p.locator('.hiw-controls button[aria-label^="Show step"]').first().focus();
  const f0 = await activeIdx();
  await p.waitForTimeout(5000);
  check("[carousel] paused while a control has keyboard focus", (await activeIdx()) === f0);
  const ring = await p.evaluate(() => parseFloat(getComputedStyle(document.activeElement).outlineWidth));
  check("[carousel] focus is visible on the controls", ring >= 2, String(ring));
  await p.keyboard.press("ArrowRight");
  await p.waitForTimeout(400);
  const k1 = await activeIdx();
  check("[carousel] ArrowRight moves one card", k1 === (f0 + 1) % 3, `${f0} -> ${k1}`);
  await p.keyboard.press("ArrowLeft");
  await p.waitForTimeout(400);
  check("[carousel] ArrowLeft moves back", (await activeIdx()) === f0);
  await p.locator('.hiw-controls button[aria-label^="Show step 3"]').click();
  await p.mouse.move(5, 450);
  await p.evaluate(() => document.activeElement?.blur());
  await p.waitForTimeout(400);
  check("[carousel] a dot selects its card", (await activeIdx()) === 2);
  await p.waitForTimeout(9000);
  check("[carousel] after interaction autoplay has stopped for good (no change in 9 s)", (await activeIdx()) === 2);
  const tab = await p.evaluate(() => [...document.querySelectorAll(".hiw-card[inert] a, .hiw-card[inert] button")].length);
  check("[carousel] side cards hold nothing focusable", tab === 0);
  await ctx.close();
}

// ---------- the robot stays alive ----------
if (want("robot")) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(base + "/", { waitUntil: "load" });
  await waitPreloader(p);
  await instantScroll(p);
  const range = await p.evaluate(() => Math.round(document.querySelector(".hiw").getBoundingClientRect().top + scrollY - document.querySelector("header").getBoundingClientRect().height));
  await scrollTo(p, range + 2, 1200);
  const gaze = (sel) => p.evaluate((s) => { const g = document.querySelector(s + " svg g[clip-path] > g > g"); return g ? getComputedStyle(g).transform : null; }, sel);
  const heroSel = "main > :first-child";
  await p.mouse.move(200, 150, { steps: 4 });
  await p.waitForTimeout(900);
  const gA = await gaze(".hiw-twin");
  const hA = await gaze(heroSel);
  await p.mouse.move(1300, 800, { steps: 4 });
  await p.waitForTimeout(900);
  const gB = await gaze(".hiw-twin");
  const hB = await gaze(heroSel);
  check("[robot] the settled robot's eyes follow the pointer", gA && gB && gA !== gB, `${gA} -> ${gB}`);
  check("[robot] the hidden hero robot's eyes stay paused while it is hidden", hA === hB, `${hA} -> ${hB}`);
  const blink = await p.evaluate(async () => {
    const g = document.querySelector(".hiw-twin svg g[clip-path] > g > g > g > g > g"); // the per-eye blink group
    let min = 1;
    const t0 = performance.now();
    while (performance.now() - t0 < 7500) {
      await new Promise((r) => requestAnimationFrame(r));
      const m = new DOMMatrixReadOnly(getComputedStyle(g).transform);
      min = Math.min(min, m.d);
    }
    return min;
  });
  check("[robot] the settled robot blinks (within 7.5 s)", blink < 0.6, blink.toFixed(2));
  const centre = await p.locator('.hiw-card[data-pos="center"] .hiw-face-full').boundingBox();
  await p.mouse.move(centre.x + centre.width / 2, centre.y + centre.height / 2, { steps: 4 });
  await p.waitForTimeout(700);
  const happy = await p.evaluate(() => Number(getComputedStyle(document.querySelector(".hiw-twin svg path[stroke]")).opacity));
  check("[robot] hovering the centre card turns the eyes happy, as in the hero", happy > 0.9, happy.toFixed(2));
  await p.mouse.move(700, 120);
  await p.waitForTimeout(1500);
  const before = await gaze(".hiw-twin");
  await p.locator('.hiw-controls button[aria-label="Next step"]').click();
  await p.mouse.move(700, 120);
  await p.waitForTimeout(1200);
  const afterG = await gaze(".hiw-twin");
  check("[robot] when the centred card changes, the robot glances toward it", before !== afterG, `${before} -> ${afterG}`);
  await ctx.close();
}

// ---------- phones and tablets: swipe ----------
if (want("swipe")) {
  for (const [w, h] of [[390, 844], [768, 1024]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: w < 500 });
    const p = await ctx.newPage();
    await p.addInitScript(CLS_INIT);
    await p.goto(base + "/", { waitUntil: "load" });
    await waitPreloader(p);
    await instantScroll(p);
    if (w === 390) await p.screenshot({ path: "shots/005/mobile-hero-390.png" });
    await p.locator("#how-it-works").scrollIntoViewIfNeeded();
    await p.waitForTimeout(600);
    const s = await p.evaluate(state);
    check(`[swipe ${w}] no travel: hero robot and cards untouched, no twin`, s.heroLayerClean && s.heroCardsClean && s.twinInert === null);
    const info = await p.evaluate(() => {
      const t = document.querySelector(".hiw-track");
      const cs = getComputedStyle(t);
      return { snap: cs.scrollSnapType, overflow: cs.overflowX, cardW: document.querySelector(".hiw-card").getBoundingClientRect().width, trackW: t.clientWidth, robot: getComputedStyle(document.querySelector(".hiw-robot-static")).display };
    });
    check(`[swipe ${w}] one full-width card at a time on a scroll-snap track, static robot shown`, /x/.test(info.snap) && info.overflow === "auto" && Math.abs(info.cardW - info.trackW) <= 6 && info.robot !== "none", JSON.stringify(info));
    const idx = () => p.evaluate(() => [...document.querySelectorAll('.hiw-controls button[aria-label^="Show step"]')].findIndex((d) => d.getAttribute("aria-current") === "true"));
    const a0 = await idx();
    await p.waitForTimeout(4600);
    const a1 = await idx();
    check(`[swipe ${w}] autoplay advances`, a1 === (a0 + 1) % 3, `${a0} -> ${a1}`);
    if (w === 390) await p.screenshot({ path: "shots/005/mobile-section-390.png" });
    // a swipe: touch start on the track, then scroll it one card
    await p.evaluate(() => { const t = document.querySelector(".hiw-track"); t.dispatchEvent(new TouchEvent("touchstart", { bubbles: true })); t.scrollBy({ left: t.clientWidth, behavior: "instant" }); });
    await p.waitForTimeout(900);
    const a2 = await idx();
    check(`[swipe ${w}] a swipe moves to the next card and the dots follow`, a2 === (a1 + 1) % 3, `${a1} -> ${a2}`);
    await p.waitForTimeout(5500);
    check(`[swipe ${w}] after a swipe autoplay has stopped`, (await idx()) === a2);
    check(`[swipe ${w}] no horizontal page scroll`, !(await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)));
    const cls = await p.evaluate(() => window.__cls);
    check(`[swipe ${w}] layout shift at or below 0.05`, cls <= 0.05, cls.toFixed(4));
    await ctx.close();
  }
}

// ---------- widths ----------
if (want("widths")) {
  for (const w of [360, 390, 768, 1024, 1440, 1920]) {
    const ctx = await b.newContext({ viewport: { width: w, height: w < 800 ? 800 : 900 } });
    const p = await ctx.newPage();
    await p.addInitScript(CLS_INIT);
    await p.goto(base + "/", { waitUntil: "load" });
    await waitPreloader(p);
    await instantScroll(p);
    const total = await p.evaluate(() => document.documentElement.scrollHeight);
    let hs = false;
    for (let y = 0; y <= total; y += 300) {
      await scrollTo(p, y, 60);
      if (await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)) hs = true;
    }
    await scrollTo(p, 0, 300);
    const poke = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(`[widths ${w}] at the top of the page nothing widens the document`, poke <= 0, `${poke}px wider`);
    const cls = await p.evaluate(() => window.__cls);
    check(`[widths ${w}] no horizontal scroll through the whole home page; layout shift at or below 0.05`, !hs && cls <= 0.05, `cls ${cls.toFixed(4)}`);
    await ctx.close();
  }
}

await b.close();
console.log(results.join("\n"));
console.log(results.some((r) => r.startsWith("FAIL")) ? "\nSOME CHECKS FAILED" : "\nALL CHECKS PASSED");
process.exit(results.some((r) => r.startsWith("FAIL")) ? 1 : 0);
