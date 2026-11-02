// Checks the "How it works" motion modes and the hero-to-steps scroll transition.
// Usage: CHROME=<path> BASE=http://localhost:3100 node scripts/transition-check.mjs
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const base = process.env.BASE ?? "http://localhost:3100";
mkdirSync("shots/003", { recursive: true });
const b = await chromium.launch({ executablePath: process.env.CHROME });
const results = [];
const check = (name, ok, extra = "") => results.push(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  (" + extra + ")" : ""}`);
const near = (a, c, tol) => Math.abs(a - c) <= tol;

// Layout-shift observer, installed before the page loads
const CLS_INIT = () => {
  window.__cls = 0;
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
  }).observe({ type: "layout-shift", buffered: true });
};

// Read the state of the transition: hero card rects/opacity, step card rects, arrival flags
const readState = () => {
  const r = (el) => {
    const b = el.getBoundingClientRect();
    return { x: b.left, y: b.top, w: b.width, h: b.height };
  };
  const stage = document.querySelector("[data-stage]");
  return {
    scrollY: Math.round(window.scrollY),
    stage: stage?.dataset.stage,
    arrived: stage?.hasAttribute("data-arrived"),
    hero: ["prompt", "build", "learn"].map((id) => {
      const el = document.querySelector(`[data-hero-card="${id}"]`);
      return { ...r(el), o: Number(getComputedStyle(el).opacity) };
    }),
    steps: [...document.querySelectorAll("[data-step-slot]")].map((s) => ({
      ...r(s.firstElementChild),
      o: Number(getComputedStyle(s.firstElementChild).opacity),
      slot: r(s),
    })),
    text: [...document.querySelectorAll(".hiw-text")].map((t) => Number(getComputedStyle(t).opacity)),
    line: getComputedStyle(document.querySelector(".hiw-line")).transform,
    hscroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  };
};
const jump = async (p, y, wait = 120) => {
  await p.evaluate((v) => window.scrollTo({ top: v, behavior: "instant" }), y);
  await p.waitForTimeout(wait);
};

// ---------- 1. Reduced motion: final state at 1440 ----------
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const p = await ctx.newPage();
  await p.goto(base + "/", { waitUntil: "load" });
  await p.waitForTimeout(1500);
  await p.locator("#how-it-works").scrollIntoViewIfNeeded();
  await p.waitForTimeout(400);
  const s = await p.evaluate(readState);
  check("[reduced motion 1440] stage mode is none", s.stage === "none", s.stage);
  check("[reduced motion 1440] three steps, all text visible (opacity 1)", s.steps.length === 3 && s.text.every((o) => o === 1), s.text.join(","));
  check("[reduced motion 1440] step cards visible (opacity 1) and not transformed", s.steps.every((c) => c.o === 1 && near(c.x, c.slot.x, 0.5) && near(c.y, c.slot.y, 0.5)));
  check("[reduced motion 1440] connector line fully drawn", s.line === "none" || /^matrix\(1,/.test(s.line), s.line);
  await p.screenshot({ path: "shots/003/hiw-reduced-1440.png" });
  await ctx.close();
}

// ---------- 2. JavaScript off: server HTML is complete ----------
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  const p = await ctx.newPage();
  await p.goto(base + "/", { waitUntil: "load" });
  const heads = await p.locator("#how-it-works ol > li h3").allInnerTexts();
  const texts = await p.locator("#how-it-works .hiw-text p").allInnerTexts();
  check("[no JS] three steps with heading and body in the HTML", heads.length === 3 && texts.length === 3 && texts.every((t) => t.length > 20), heads.join(" | "));
  const vis = await p.evaluate(() => [...document.querySelectorAll(".hiw-text")].map((t) => getComputedStyle(t).opacity));
  check("[no JS] step text visible (opacity 1)", vis.every((o) => o === "1"), vis.join(","));
  await p.locator("#how-it-works").scrollIntoViewIfNeeded();
  await p.screenshot({ path: "shots/003/hiw-nojs-1440.png" });
  await ctx.close();
}

// ---------- 3. Narrow screen: fade in once, hero cards stay ----------
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  await p.addInitScript(CLS_INIT);
  await p.goto(base + "/", { waitUntil: "load" });
  await p.waitForTimeout(7000);
  const before = await p.evaluate(readState);
  check("[390] stage mode is fade", before.stage === "fade", before.stage);
  check("[390] hero cards untouched (opacity 1)", before.hero.every((h) => h.o === 1 || h.w === 0));
  const op0 = await p.evaluate(() => Number(getComputedStyle(document.querySelector("[data-stage]")).opacity));
  check("[390] section starts faded out before it is in view", op0 === 0, String(op0));
  await p.locator("#how-it-works").scrollIntoViewIfNeeded();
  await p.waitForTimeout(900);
  const after = await p.evaluate(() => ({
    o: Number(getComputedStyle(document.querySelector("[data-stage]")).opacity),
    t: [...document.querySelectorAll(".hiw-text")].map((t) => Number(getComputedStyle(t).opacity)),
  }));
  check("[390] section fades in on entering view; text visible", after.o === 1 && after.t.every((o) => o === 1), JSON.stringify(after));
  await p.screenshot({ path: "shots/003/hiw-390.png" });
  const cls = await p.evaluate(() => window.__cls);
  check("[390] layout shift at or below 0.05", cls <= 0.05, cls.toFixed(4));
  check("[390] no horizontal scroll", !(await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)));
  await ctx.close();
}

// ---------- 4. Desktop travel sequence ----------
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.addInitScript(CLS_INIT);
  await p.goto(base + "/", { waitUntil: "load" });
  await p.waitForTimeout(8000);
  await jump(p, 0, 300);
  const s0 = await p.evaluate(readState);
  check("[1440] stage mode is travel", s0.stage === "travel", s0.stage);
  const cx = (c) => c.x + c.w / 2, cy = (c) => c.y + c.h / 2;
  const heroCard = () => document.querySelector("[data-hero-card]");
  // The hero floats, so compare against the hero card's own visible box, read in the same instant.
  const handoff = async (y) => {
    await jump(p, y, 60);
    return p.evaluate(() => {
      const r = (el) => { const b = el.getBoundingClientRect(); return { cx: b.left + b.width / 2, cy: b.top + b.height / 2, w: b.width, h: b.height }; };
      return ["prompt", "build", "learn"].map((id, i) => {
        const hero = document.querySelector(`[data-hero-card="${id}"]`);
        const card = hero.querySelector(".backdrop-blur-md");
        const step = document.querySelectorAll("[data-step-slot]")[i].querySelector(".backdrop-blur-md");
        return { hero: r(card), step: r(step), heroO: Number(getComputedStyle(hero).opacity), stepO: Number(getComputedStyle(step.closest("[style*='opacity']") ?? step).opacity) };
      });
    });
  };
  const h3 = await handoff(3);
  const same = h3.every((c) => Math.abs(c.hero.cx - c.step.cx) <= 3 && Math.abs(c.hero.cy - c.step.cy) <= 3 && Math.abs(c.hero.w - c.step.w) <= 6 && Math.abs(c.hero.h - c.step.h) <= 6);
  check("[1440] 3px into the scroll the step card is exactly on the hero card (same size, within 3px)", same, h3.map((c, i) => `${i}:dx${(c.step.cx - c.hero.cx).toFixed(1)} dy${(c.step.cy - c.hero.cy).toFixed(1)} dw${(c.step.w - c.hero.w).toFixed(1)} dh${(c.step.h - c.hero.h).toFixed(1)}`).join(" "));
  check("[1440] 3px into the scroll the hero card is hidden and the step card shown (one card, no overlap)", h3.every((c) => c.heroO === 0 && c.stepO === 1), JSON.stringify(h3.map((c) => [c.heroO, c.stepO])));
  await p.screenshot({ path: "shots/003/handoff-3px.png", clip: { x: 700, y: 80, width: 700, height: 500 } });
  await handoff(40);
  await p.screenshot({ path: "shots/003/handoff-40px.png", clip: { x: 600, y: 80, width: 800, height: 700 } });
  const h0 = await handoff(0);
  check("[1440] back at scroll 0 the hero card is shown and the step card hidden", h0.every((c) => c.heroO === 1 && c.stepO === 0), JSON.stringify(h0.map((c) => [c.heroO, c.stepO])));
  await p.screenshot({ path: "shots/003/handoff-0px.png", clip: { x: 700, y: 80, width: 700, height: 500 } });
  check("[1440] at scroll 0 hero cards visible, step cards hidden", s0.hero.every((h) => h.o === 1) && s0.steps.every((c) => c.o === 0));
  check("[1440] at scroll 0 step text and line are hidden", s0.text.every((o) => o === 0) && /^matrix\(0,/.test(s0.line), s0.line);

  // range: where the first step slot's resting top would be at arrival
  const range = await p.evaluate(() => {
    const s = document.querySelector("[data-step-slot]");
    return Math.round(s.getBoundingClientRect().top + window.scrollY - 0.45 * window.innerHeight);
  });
  const marks = [["start", 0], ["p02", 0.02], ["p08", 0.08], ["p25", 0.25], ["p50", 0.5], ["p75", 0.75], ["p99", 0.99]];
  const rects = {};
  for (const [name, f] of marks) {
    await jump(p, Math.round(range * f), 200);
    rects[name] = await p.evaluate(readState);
    await p.screenshot({ path: `shots/003/seq-${name}.png` });
  }
  const mid = rects.p50;
  check("[1440] mid-travel: step cards visible and away from their slots", mid.steps.every((c) => c.o === 1 && (Math.abs(c.x - c.slot.x) > 5 || Math.abs(c.y - c.slot.y) > 5)));
  check("[1440] mid-travel: hero cards hidden", mid.hero.every((h) => h.o === 0));
  check("[1440] before arrival: not arrived, text hidden", !rects.p99.arrived && rects.p99.text.every((o) => o === 0));

  // arrival
  await jump(p, range + 2, 60);
  await p.waitForTimeout(250);
  await p.screenshot({ path: "shots/003/seq-arrival-250ms.png" });
  await p.waitForTimeout(700);
  const settled = await p.evaluate(readState);
  await p.screenshot({ path: "shots/003/seq-arrival-1000ms.png" });
  check("[1440] arrived flag set", settled.arrived);
  check("[1440] cards at their slots after arrival (within 1px)", settled.steps.every((c) => near(c.x, c.slot.x, 1) && near(c.y, c.slot.y, 1)), settled.steps.map((c) => `${(c.x - c.slot.x).toFixed(2)},${(c.y - c.slot.y).toFixed(2)}`).join(" "));
  check("[1440] after arrival text visible and line drawn", settled.text.every((o) => o > 0.99) && /^matrix\(1,/.test(settled.line), `${settled.text.join(",")} ${settled.line}`);

  // settle overshoot: sample the scale of the inner card every frame right after arrival
  await jump(p, 0, 300);
  await jump(p, range - 5, 300);
  const samples = await p.evaluate(async (r) => {
    const inner = document.querySelector("[data-step-slot]").firstElementChild.firstElementChild;
    const out = [];
    window.scrollTo({ top: r + 3, behavior: "instant" });
    const t0 = performance.now();
    while (performance.now() - t0 < 900) {
      await new Promise((res) => requestAnimationFrame(res));
      out.push(Number(new DOMMatrixReadOnly(getComputedStyle(inner).transform).a.toFixed(4)));
    }
    return out;
  }, range);
  const peak = Math.max(...samples);
  check("[1440] settle overshoots to about 1.03 and returns to 1", peak > 1.015 && peak < 1.06 && near(samples.at(-1), 1, 0.002), `peak ${peak}, end ${samples.at(-1)}`);

  // scroll back up: everything returns
  await jump(p, 0, 700);
  const back = await p.evaluate(readState);
  check("[1440] back at top: not arrived, hero cards visible again, step cards hidden", !back.arrived && back.hero.every((h) => h.o === 1) && back.steps.every((c) => c.o === 0));

  // step down in 20px scrolls: the card never moves more than a smooth amount per step
  let worst = 0;
  let prev = null;
  for (let y = 0; y <= range + 60; y += 20) {
    await jump(p, y, 30);
    await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r)))));
    const s = await p.evaluate(readState);
    if (prev) {
      s.steps.forEach((c, i) => {
        const moved = Math.abs(c.y - prev.s.steps[i].y + (y - prev.y)); // card movement beyond the page's own scroll
        worst = Math.max(worst, moved);
      });
    }
    prev = { y, s };
  }
  check("[1440] travel is continuous (card movement beyond scroll stays under 45px per 20px step)", worst < 45, `worst ${worst.toFixed(1)}px`);
  for (let y = range + 60; y >= 0; y -= 20) await jump(p, y, 20);
  await jump(p, 0, 600);
  const back2 = await p.evaluate(readState);
  check("[1440] stepping back up to the top: hero cards shown, step cards hidden", back2.hero.every((h) => h.o === 1) && back2.steps.every((c) => c.o === 0));

  const cls = await p.evaluate(() => window.__cls);
  check("[1440] layout shift across the whole run at or below 0.05", cls <= 0.05, cls.toFixed(4));
  check("[1440] no horizontal scroll at any sampled position", Object.values(rects).every((r) => !r.hscroll));

  // fast jump to the bottom and back
  await jump(p, 99999, 100);
  await jump(p, 0, 700);
  const fb = await p.evaluate(readState);
  check("[1440] fast jump to the bottom and back leaves a clean start state", !fb.arrived && fb.hero.every((h) => h.o === 1));

  // hero card hover still works at scroll 0
  const box = await p.locator('[data-hero-card="build"]').boundingBox();
  await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 4 });
  await p.waitForTimeout(700);
  const grown = await p.locator('[data-hero-card="build"]').boundingBox();
  check("[1440] hero card still expands on hover at scroll 0", grown.height > box.height + 5, `${box.height.toFixed(0)} to ${grown.height.toFixed(0)}`);
  await ctx.close();
}

// ---------- 5. Loaded already past the section; resize across 1024 ----------
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(base + "/", { waitUntil: "load" });
  await p.waitForTimeout(7000);
  await p.evaluate(() => window.scrollTo({ top: 1500, behavior: "instant" }));
  await p.waitForTimeout(300);
  await p.reload({ waitUntil: "load" });
  await p.waitForTimeout(8000);
  const s = await p.evaluate(readState);
  check("[1440] reload while scrolled past the section: settled, nothing hidden", s.arrived && s.steps.every((c) => c.o === 1 && near(c.x, c.slot.x, 1)) && s.text.every((o) => o > 0.99), `scrollY ${s.scrollY}`);
  await p.setViewportSize({ width: 900, height: 900 });
  await p.waitForTimeout(600);
  const narrow = await p.evaluate(readState);
  check("[900] after resizing below 1024: fade mode, hero cards visible", narrow.stage === "fade" && narrow.hero.every((h) => h.o === 1 || h.w === 0), narrow.stage);
  await p.setViewportSize({ width: 1440, height: 900 });
  await p.waitForTimeout(600);
  await p.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await p.waitForTimeout(500);
  const wide = await p.evaluate(readState);
  check("[1440] after resizing back: travel mode, hero cards shown again", wide.stage === "travel" && wide.hero.every((h) => h.o === 1) && wide.steps.every((c) => c.o === 0), wide.stage);
  await ctx.close();
}

await b.close();
console.log(results.join("\n"));
console.log(results.some((r) => r.startsWith("FAIL")) ? "\nSOME CHECKS FAILED" : "\nALL CHECKS PASSED");
