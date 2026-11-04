// Checks for the home page "How it works" section (feature 007): layout, hand-off, carousel, reduced motion,
// no JavaScript, breathing, and that the hero is untouched.
// Usage: CHROME=<path to chrome.exe> BASE=http://localhost:3000 [ONLY=layout,nojs,...] [SNAPSHOT=write] node scripts/how-it-works-check.mjs
// SNAPSHOT=write saves the hero's positions to shots/007/hero-before.json (do it before changing the hero's surroundings);
// normal runs compare against it. Sections are added story by story.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const base = process.env.BASE ?? "http://localhost:3000";
const only = process.env.ONLY ? new Set(process.env.ONLY.split(",")) : null;
const run = (name) => !only || only.has(name);
const shots = "shots/007";
mkdirSync(shots, { recursive: true });

const b = await chromium.launch({ executablePath: process.env.CHROME });
const results = [];
const check = (name, ok, extra = "") => results.push(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  (" + extra + ")" : ""}`);

const STEPS = [
  { id: "prompt", name: "Prompt", example: "Turn a lesson plan into 5 quiz questions in 2 minutes" },
  { id: "build", name: "Build", example: "A marking helper you set up in 20 minutes" },
  { id: "learn", name: "Learn", example: "Teach your class to check AI answers" },
];

/** A fresh browser session. `reducedMotion` emulates the visitor's setting; `js: false` disables scripts. */
async function newPage(w, h, { js = true, reducedMotion = false, touch = false } = {}) {
  const ctx = await b.newContext({
    viewport: { width: w, height: h },
    javaScriptEnabled: js,
    reducedMotion: reducedMotion ? "reduce" : "no-preference",
    hasTouch: touch,
  });
  const p = await ctx.newPage();
  const logs = [];
  p.on("console", (m) => {
    if (["error", "warning"].includes(m.type())) logs.push(m.text());
  });
  p.on("pageerror", (e) => logs.push(e.message));
  return { ctx, p, logs };
}

/** Loads a page and waits for the brand preloader to finish (it plays on load and covers the page). */
async function open(p, path = "/", js = true) {
  await p.goto(`${base}${path}`, { waitUntil: js ? "networkidle" : "load" });
  if (js) await p.waitForFunction(() => document.documentElement.getAttribute("data-preloader") !== "run", null, { timeout: 20000 });
  await p.waitForTimeout(400);
}

const noHScroll = (p) => p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

/** Positions of the hero and what is in it, rounded. The cards and robot float gently, so compare them loosely. */
const heroSnapshot = (p) =>
  p.evaluate(() => {
    const hero = document.querySelector("main")?.firstElementChild;
    const rect = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return [Math.round(r.left), Math.round(r.top + window.scrollY), Math.round(r.width), Math.round(r.height)];
    };
    return {
      hero: rect(hero),
      h1: rect(hero?.querySelector("h1")),
      robot: rect(hero?.querySelector('img[alt="Tareeq robot assistant"]')),
      cards: ["prompt", "build", "learn"].map((id) => rect(hero?.querySelector(`[data-hero-card="${id}"]`))),
    };
  });

/** Nothing the hand-off sets may be left on the hero's cards. */
const heroCardsClean = (p) =>
  p.evaluate(() =>
    ["prompt", "build", "learn"].every((id) => {
      const el = document.querySelector(`[data-hero-card="${id}"]`);
      return el && !el.hasAttribute("inert") && !el.hasAttribute("aria-hidden") && el.style.visibility === "";
    }),
  );

const near = (a, b, tol) => a && b && a.every((v, i) => Math.abs(v - b[i]) <= tol);

/** Screenshot of the section (after its entrance effects have settled). */
async function shotSection(p, file) {
  await p.locator("#how-it-works").scrollIntoViewIfNeeded();
  await p.waitForTimeout(1200);
  await p.locator("#how-it-works").screenshot({ path: `${shots}/${file}` });
}

// ---------- Hero snapshot (write once, before the section changes anything) ----------
if (process.env.SNAPSHOT === "write") {
  const out = {};
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const { ctx, p } = await newPage(w, h);
    await open(p);
    await p.waitForTimeout(2000);
    out[w] = await heroSnapshot(p);
    await ctx.close();
  }
  writeFileSync(`${shots}/hero-before.json`, JSON.stringify(out, null, 1));
  console.log(`hero snapshot written to ${shots}/hero-before.json`);
  await b.close();
  process.exit(0);
}

// ---------- Layout at every width, and the image ----------
if (run("layout")) {
  for (const [w, h] of [[360, 740], [390, 844], [768, 1024], [1024, 768], [1440, 900]]) {
    const { ctx, p, logs } = await newPage(w, h);
    const tag = `[${w}x${h}] layout`;
    await open(p);
    await p.locator("#how-it-works").scrollIntoViewIfNeeded();
    await p.waitForTimeout(800);
    check(`${tag} no horizontal scroll`, await noHScroll(p));
    const m = await p.evaluate(() => {
      const box = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
      };
      const img = document.querySelector(".hiw-robot img");
      return {
        head: box(".hiw-head"),
        robot: box(".hiw-robot"),
        carousel: box(".hiw-carousel"),
        h2: document.querySelector("#hiw-title")?.textContent?.trim(),
        img: img && {
          width: img.getAttribute("width"),
          height: img.getAttribute("height"),
          loading: img.getAttribute("loading"),
          alt: img.getAttribute("alt"),
          transform: getComputedStyle(img).transform,
          src: img.currentSrc || img.src,
        },
      };
    });
    check(`${tag} the heading reads "How it works"`, m.h2 === "How it works");
    if (w >= 1024) {
      check(`${tag} two columns: robot on the left, heading and carousel on the right`, m.robot.right <= m.head.left + 1 && m.robot.right <= m.carousel.left + 1);
      check(`${tag} the heading sits above the carousel`, m.head.bottom <= m.carousel.top + 1);
    } else {
      check(`${tag} stacked: heading, then robot, then carousel`, m.head.bottom <= m.robot.top + 1 && m.robot.bottom <= m.carousel.top + 1);
      check(`${tag} the robot is centred`, Math.abs((m.robot.left + m.robot.right) / 2 - w / 2) <= 2);
    }
    check(`${tag} the robot image has explicit dimensions (408 x 612)`, m.img?.width === "408" && m.img?.height === "612");
    check(`${tag} the robot image is lazy`, m.img?.loading === "lazy");
    check(`${tag} the robot image has a description`, (m.img?.alt ?? "").length > 10, m.img?.alt);
    check(`${tag} the robot image is not mirrored`, !/matrix\(-/.test(m.img?.transform ?? "") && !m.img?.src.includes("flip"));
    await shotSection(p, `layout-${w}x${h}.png`);
    check(`${tag} no console errors`, logs.length === 0, logs.slice(0, 2).join(" | "));
    await ctx.close();
  }
}

// ---------- No JavaScript: everything readable ----------
if (run("nojs")) {
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const { ctx, p } = await newPage(w, h, { js: false });
    const tag = `[${w}px JS off] How it works`;
    await open(p, "/", false);
    const text = await p.locator("#how-it-works").innerText();
    for (const s of STEPS) {
      check(`${tag} the ${s.name} step and its example are readable`, text.includes(s.name) && text.includes(s.example));
    }
    check(`${tag} no carousel controls shown`, !(await p.locator("#how-it-works .hiw-controls").first().isVisible()));
    check(`${tag} no flip buttons shown`, (await p.locator("#how-it-works .hiw-flip-btn").evaluateAll((els) => els.filter((e) => e.getClientRects().length > 0).length)) === 0);
    check(`${tag} no horizontal scroll`, await noHScroll(p));
    await ctx.close();
  }
}

// ---------- Carousel helpers ----------
const activeIndex = (p) => p.evaluate(() => [...document.querySelectorAll(".hiw-card")].findIndex((c) => c.getAttribute("data-pos") === "active"));
const flippedIndex = (p) => p.evaluate(() => [...document.querySelectorAll(".hiw-card")].findIndex((c) => c.hasAttribute("data-flipped")));
const showCarousel = async (p) => {
  await p.locator(".hiw-carousel").scrollIntoViewIfNeeded();
  await p.waitForTimeout(500);
};
/** Waits up to `ms` for the active card to change from `from`; returns the time it took, or null. */
async function changeWithin(p, from, ms) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if ((await activeIndex(p)) !== from) return Date.now() - t0;
    await p.waitForTimeout(100);
  }
  return null;
}
/** A one-finger gesture through the browser's own touch input (so pointer events arrive as pointerType "touch"). */
async function touchDrag(p, cdp, x0, y0, x1, y1) {
  const point = (x, y) => [{ x, y, id: 1 }];
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: point(x0, y0) });
  for (let i = 1; i <= 8; i++) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: point(x0 + ((x1 - x0) * i) / 8, y0 + ((y1 - y0) * i) / 8) });
    await p.waitForTimeout(16);
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
}
const trackBox = async (p) => p.locator(".hiw-track").boundingBox();

// ---------- Carousel: auto-advance every 5 s and every pause rule (mouse, 1440) ----------
if (run("carousel")) {
  const { ctx, p, logs } = await newPage(1440, 900);
  const tag = "[1440px] carousel";
  await open(p);
  await showCarousel(p);
  await p.mouse.move(40, 300); // over the page, not over the card
  let i = await activeIndex(p);
  check(`${tag} one card is in focus`, i >= 0);
  const t1 = await changeWithin(p, i, 8000);
  i = await activeIndex(p);
  const t2 = await changeWithin(p, i, 8000);
  check(`${tag} advances every 5 s (pointer elsewhere in the section does not pause it)`, t1 !== null && t2 !== null && t2 >= 4500 && t2 <= 5500, `second interval ${t2} ms`);

  // pointer over the card in focus holds it, and flips the card
  i = await activeIndex(p);
  const box = await trackBox(p);
  await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  check(`${tag} pointer over the card in focus holds auto-advance`, (await changeWithin(p, i, 7000)) === null);
  await p.mouse.move(40, 300);
  check(`${tag} auto-advance resumes when the pointer leaves`, (await changeWithin(p, i, 8000)) !== null);

  // keyboard focus inside holds it
  await p.focus('.hiw-controls button[aria-label^="Show step"]');
  i = await activeIndex(p);
  check(`${tag} focus inside the carousel holds auto-advance`, (await changeWithin(p, i, 7000)) === null);
  await p.evaluate(() => document.activeElement?.blur());
  check(`${tag} auto-advance resumes when focus leaves`, (await changeWithin(p, i, 8000)) !== null);

  // hidden tab holds it
  i = await activeIndex(p);
  await p.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { get: () => "hidden", configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  check(`${tag} a hidden tab holds auto-advance`, (await changeWithin(p, i, 7000)) === null);
  await p.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { get: () => "visible", configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  check(`${tag} auto-advance resumes when the tab is visible again`, (await changeWithin(p, i, 8000)) !== null);

  // off screen holds it
  i = await activeIndex(p);
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.waitForTimeout(500);
  check(`${tag} the section off screen holds auto-advance`, (await changeWithin(p, i, 7000)) === null);
  await showCarousel(p);
  check(`${tag} auto-advance resumes when the section is back on screen`, (await changeWithin(p, i, 8000)) !== null);
  check(`${tag} no console errors`, logs.length === 0, logs.slice(0, 2).join(" | "));
  await ctx.close();
}

// ---------- Controls: dots, buttons, arrow keys, drag, sizes ----------
if (run("controls")) {
  const { ctx, p } = await newPage(1440, 900);
  const tag = "[1440px] controls";
  await open(p);
  await showCarousel(p);
  await p.mouse.move(40, 300);
  const dots = p.locator('.hiw-controls button[aria-label^="Show step"]');
  for (const k of [2, 1, 0]) {
    await dots.nth(k).click();
    await p.waitForTimeout(150);
    check(`${tag} dot ${k + 1} brings card ${k + 1} into focus and is marked current`, (await activeIndex(p)) === k && (await dots.nth(k).getAttribute("aria-current")) === "true");
  }
  await p.click('.hiw-controls button[aria-label="Next step"]');
  check(`${tag} Next moves forward`, (await activeIndex(p)) === 1);
  await p.click('.hiw-controls button[aria-label="Previous step"]');
  await p.click('.hiw-controls button[aria-label="Previous step"]');
  check(`${tag} Previous cycles from the first card to the last`, (await activeIndex(p)) === 2);
  await dots.nth(0).click(); // card 1 in focus, and focus inside the carousel
  await p.keyboard.press("ArrowRight");
  check(`${tag} the Right arrow key moves forward`, (await activeIndex(p)) === 1);
  await p.keyboard.press("ArrowLeft");
  check(`${tag} the Left arrow key moves back`, (await activeIndex(p)) === 0);
  const small = await p.locator(".hiw-controls button").evaluateAll((els) => els.filter((e) => { const r = e.getBoundingClientRect(); return r.width < 43.5 || r.height < 43.5; }).length);
  check(`${tag} every control is at least 44px`, small === 0);
  check(`${tag} only the card in focus is reachable (the others are inert and hidden from assistive technology)`, await p.evaluate(() => [...document.querySelectorAll(".hiw-card")].every((c) => (c.getAttribute("data-pos") === "active") === (!c.hasAttribute("inert") && c.getAttribute("aria-hidden") !== "true"))));
  check(`${tag} the carousel is a labelled region and each card a labelled slide`, await p.evaluate(() => { const r = document.querySelector('.hiw-carousel [role="region"]'); const cards = [...document.querySelectorAll(".hiw-card")]; return r?.getAttribute("aria-roledescription") === "carousel" && cards.every((c, i) => c.getAttribute("aria-roledescription") === "slide" && c.getAttribute("aria-label")?.startsWith(`${i + 1} of 3`)); }));

  // a sideways mouse drag moves the card; a tiny movement does not
  await dots.nth(0).click();
  await p.mouse.move(40, 300);
  let box = await trackBox(p);
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  await p.mouse.move(cx, cy);
  await p.mouse.down();
  await p.mouse.move(cx - 140, cy, { steps: 8 });
  await p.mouse.up();
  await p.waitForTimeout(300);
  check(`${tag} a sideways drag moves to the next card`, (await activeIndex(p)) === 1);
  await ctx.close();

  // touch swipe (390): sideways moves one card, a mostly vertical gesture does not
  const phone = await newPage(390, 844, { touch: true });
  await open(phone.p);
  await showCarousel(phone.p);
  const cdp = await phone.ctx.newCDPSession(phone.p);
  box = await trackBox(phone.p);
  const mx = box.x + box.width / 2, my = box.y + box.height / 2;
  const before = await activeIndex(phone.p);
  await touchDrag(phone.p, cdp, mx + 100, my, mx - 100, my);
  await phone.p.waitForTimeout(400);
  const after = await activeIndex(phone.p);
  check(`[390px touch] controls: a swipe left moves to the next card`, after === (before + 1) % 3, `${before} -> ${after}`);
  await touchDrag(phone.p, cdp, mx - 100, my, mx + 100, my);
  await phone.p.waitForTimeout(400);
  check(`[390px touch] controls: a swipe right moves back`, (await activeIndex(phone.p)) === before);
  const y0 = my;
  await touchDrag(phone.p, cdp, mx, y0 + 60, mx + 6, y0 - 60);
  await phone.p.waitForTimeout(400);
  check(`[390px touch] controls: a mostly vertical gesture does not move the carousel`, (await activeIndex(phone.p)) === before);
  const smallPhone = await phone.p.locator(".hiw-controls button").evaluateAll((els) => els.filter((e) => { const r = e.getBoundingClientRect(); return r.width < 43.5 || r.height < 43.5; }).length);
  check(`[390px touch] controls: every control is at least 44px`, smallPhone === 0);
  await phone.ctx.close();
}

// ---------- A touch swipe or tap stops auto-advance for the rest of the visit ----------
if (run("touch-stop")) {
  for (const gesture of ["swipe", "tap"]) {
    const { ctx, p } = await newPage(390, 844, { touch: true });
    const tag = `[390px touch] stop after a ${gesture}`;
    await open(p);
    await showCarousel(p);
    const cdp = await ctx.newCDPSession(p);
    const box = await trackBox(p);
    const mx = box.x + box.width / 2, my = box.y + box.height / 2;
    if (gesture === "swipe") await touchDrag(p, cdp, mx + 100, my, mx - 100, my);
    else await p.touchscreen.tap(mx, my);
    await p.waitForTimeout(500);
    const i = await activeIndex(p);
    check(`${tag}: auto-advance never runs again (12 s)`, (await changeWithin(p, i, 12000)) === null);
    await ctx.close();
  }
}

// ---------- Flip: hover, tap, Enter and Space, on all three cards ----------
if (run("flip")) {
  const { ctx, p } = await newPage(1440, 900);
  const tag = "[1440px] flip";
  await open(p);
  await showCarousel(p);
  await p.mouse.move(40, 300);
  const dots = p.locator('.hiw-controls button[aria-label^="Show step"]');
  for (const [k, step] of STEPS.entries()) {
    await dots.nth(k).click();
    await p.waitForTimeout(500);
    const card = `.hiw-card[data-step="${step.id}"]`;
    const back = p.locator(`${card} .hiw-face-back p`);
    // keyboard: Enter shows the back, Space on "Back" returns
    const front = p.locator(`${card} .hiw-face-front .hiw-flip-btn`);
    await front.focus();
    await p.keyboard.press("Enter");
    await p.waitForTimeout(150);
    check(`${tag} ${step.name}: Enter on "See an example" flips to the back`, (await flippedIndex(p)) === k);
    check(`${tag} ${step.name}: the back reads its example`, (await back.innerText()).trim() === step.example, await back.innerText());
    check(`${tag} ${step.name}: the front is inert while the back shows`, await p.locator(`${card} .hiw-face-front`).evaluate((el) => el.hasAttribute("inert")));
    await p.locator(`${card} .hiw-face-back .hiw-flip-btn`).focus();
    await p.keyboard.press("Space");
    await p.waitForTimeout(150);
    check(`${tag} ${step.name}: Space on "Back" returns to the front`, (await flippedIndex(p)) === -1);
    check(`${tag} ${step.name}: the back is inert again`, await p.locator(`${card} .hiw-face-back`).evaluate((el) => el.hasAttribute("inert")));
    // pointer: hovering the card flips it after a short rest and leaving returns it
    await p.evaluate(() => document.activeElement?.blur());
    const box = await trackBox(p);
    await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await p.waitForTimeout(500);
    check(`${tag} ${step.name}: hovering the card flips it`, (await flippedIndex(p)) === k);
    await p.mouse.move(40, 300);
    await p.waitForTimeout(500);
    check(`${tag} ${step.name}: leaving the card flips it back`, (await flippedIndex(p)) === -1);
  }
  check(`${tag} the Prompt back reads exactly "Turn a lesson plan into 5 quiz questions in 2 minutes"`, (await p.locator('.hiw-card[data-step="prompt"] .hiw-face-back p').innerText()).trim() === "Turn a lesson plan into 5 quiz questions in 2 minutes");
  await dots.nth(0).click();
  await p.locator(".hiw-card[data-pos='active'] .hiw-face-front .hiw-flip-btn").focus();
  await p.keyboard.press("Enter");
  await p.waitForTimeout(800);
  await p.locator("#how-it-works").screenshot({ path: `${shots}/flip-1440.png` });
  await ctx.close();

  // tap on a touch screen
  const phone = await newPage(390, 844, { touch: true });
  await open(phone.p);
  await showCarousel(phone.p);
  let box = await trackBox(phone.p);
  const tx = box.x + box.width / 2, ty = box.y + 40;
  await phone.p.touchscreen.tap(tx, ty);
  await phone.p.waitForTimeout(400);
  check(`[390px touch] flip: a tap on the card flips it`, (await flippedIndex(phone.p)) >= 0);
  await phone.p.touchscreen.tap(tx, ty);
  await phone.p.waitForTimeout(400);
  check(`[390px touch] flip: a second tap flips it back`, (await flippedIndex(phone.p)) === -1);
  await phone.ctx.close();
}

// ---------- Hand-off: the hero's cards travel into the carousel ----------
/** Scroll position at which the cards should have arrived (the carousel slot's centre at 60% of the viewport). */
const arrivalY = (p) =>
  p.evaluate(() => {
    const r = document.querySelector(".hiw-track").getBoundingClientRect();
    return Math.round(r.top + window.scrollY + r.height / 2 - 0.6 * window.innerHeight);
  });
const startSampler = (p) =>
  p.evaluate(() => {
    const heroCards = ["prompt", "build", "learn"].map((id) => document.querySelector(`[data-hero-card="${id}"]`));
    const heroRoot = document.querySelector("main").firstElementChild;
    const robot = heroRoot.querySelector('img[alt="Tareeq robot assistant"]');
    window.__samples = [];
    window.__sampling = true;
    const t0 = performance.now();
    const tick = () => {
      if (!window.__sampling) return;
      const hidden = heroCards.filter((c) => c.style.visibility === "hidden").length;
      const twins = [...document.querySelectorAll(".hiw-card-travel")];
      const visible = twins.filter((el) => parseFloat(el.style.opacity || "0") > 0.05).length;
      const activeTwin = document.querySelector(".hiw-card[data-pos='active'] .hiw-card-travel") ?? twins[0];
      const m = new DOMMatrixReadOnly(getComputedStyle(activeTwin).transform);
      const fronts = [...document.querySelectorAll(".hiw-face-front")].filter((el) => parseFloat(el.style.opacity || "0") > 0.05 && parseFloat(el.closest(".hiw-card-travel").style.opacity || "0") > 0.05).length;
      const settled = document.querySelector(".hiw").hasAttribute("data-arrived");
      const hr = heroCards[0].getBoundingClientRect();
      const t0r = twins[0].querySelector(".hiw-face-compact")?.getBoundingClientRect();
      window.__samples.push({
        t: performance.now() - t0,
        y: window.scrollY,
        heroHidden: hidden,
        visible,
        fronts,
        settled,
        tx: m.e,
        ty: m.f,
        robotRel: robot.getBoundingClientRect().top - heroRoot.getBoundingClientRect().top,
        // distance between the hero's Prompt card and its twin's compact face (only meaningful while handed off)
        gap: t0r && hidden === 3 ? Math.hypot(t0r.left + t0r.width / 2 - (hr.left + hr.width / 2), t0r.top + t0r.height / 2 - (hr.top + hr.height / 2)) : null,
      });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
const stopSampler = (p) => p.evaluate(() => { window.__sampling = false; return window.__samples; });
const scrollSteps = async (p, from, to, step = 20) => {
  const dir = to >= from ? 1 : -1;
  for (let y = from; dir > 0 ? y < to : y > to; y += dir * step) {
    await p.evaluate((v) => window.scrollTo(0, v), y);
    await p.waitForTimeout(16);
  }
  await p.evaluate((v) => window.scrollTo(0, v), to);
};

if (run("handoff")) {
  const snap = existsSync(`${shots}/hero-before.json`) ? JSON.parse(readFileSync(`${shots}/hero-before.json`, "utf8")) : null;
  for (const [w, h] of [[1440, 900], [1024, 768], [768, 1024]]) {
    const { ctx, p, logs } = await newPage(w, h);
    const tag = `[${w}x${h}] hand-off`;
    await open(p);
    await p.waitForTimeout(1500);
    const target = await arrivalY(p);
    await p.screenshot({ path: `${shots}/handoff-1-top-${w}.png` });

    // slow scroll down and back: one set of cards in every frame, the hero robot never moves
    await startSampler(p);
    await scrollSteps(p, 0, target, 12);
    await p.waitForTimeout(1200);
    await p.screenshot({ path: `${shots}/handoff-4-arrived-${w}.png` });
    if (w === 1440) {
      for (const pct of [0.2, 0.35, 0.5, 0.65, 0.8]) {
        await p.evaluate((v) => window.scrollTo(0, v), Math.round(target * pct));
        await p.waitForTimeout(900);
        await p.screenshot({ path: `${shots}/handoff-path-${Math.round(pct * 100)}-${w}.png` });
      }
      await p.evaluate((v) => window.scrollTo(0, v), target);
      await p.waitForTimeout(900);
    }
    await scrollSteps(p, target, 0, 12);
    await p.waitForTimeout(1500);
    const samples = await stopSampler(p);
    const bad = samples.filter((x) => !((x.heroHidden === 3 && x.visible >= 1) || (x.heroHidden === 0 && x.visible === 0)));
    check(`${tag} exactly one set of cards in every frame (${samples.length} frames)`, bad.length === 0, bad.length ? `${bad.length} bad, first at y=${bad[0].y}` : "");
    const crowded = samples.filter((x) => !x.settled && x.fronts > 1);
    check(`${tag} while travelling only one big card face is visible at a time (no overlapping text)`, crowded.length === 0, crowded.length ? `${crowded.length} frames with ${crowded[0].fronts}` : "");
    const rel = samples.map((x) => x.robotRel);
    check(`${tag} the hero robot never moves relative to the hero`, Math.max(...rel) - Math.min(...rel) <= 8, `${(Math.max(...rel) - Math.min(...rel)).toFixed(1)} px`);
    const gaps = samples.map((x) => x.gap).filter((g) => g !== null);
    check(`${tag} each twin sits on its hero card while handed off (no pop)`, gaps.length > 0 && gaps[0] <= 6, `first frame ${gaps[0]?.toFixed(1)} px`);
    check(`${tag} the cards went through the whole path (hero hidden at some point, shown again after)`, samples.some((x) => x.heroHidden === 3) && samples.at(-1).heroHidden === 0);
    check(`${tag} back at the top the hero's cards are exactly as they were (no inert, aria-hidden or inline hiding left)`, await heroCardsClean(p));
    const after = await heroSnapshot(p);
    const before = snap?.[w];
    if (before) {
      check(`${tag} the hero is where it was (hero, heading within 2px; floating robot and cards within 24px)`, near(after.hero, before.hero, 2) && near(after.h1, before.h1, 2) && near(after.robot, before.robot, 24) && after.cards.every((c, i) => near(c, before.cards[i], 24)));
    } else if (w === 1440) check(`${tag} hero snapshot found (run once with SNAPSHOT=write)`, false);

    // a fast jump to the arrival point: the spring overshoots a little and settles
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.waitForTimeout(1000);
    await startSampler(p);
    await p.evaluate((v) => window.scrollTo(0, v), 4);
    await p.waitForTimeout(250);
    const d0 = (await p.evaluate(() => { const el = document.querySelector(".hiw-card[data-pos='active'] .hiw-card-travel") ?? document.querySelector(".hiw-card-travel"); const m = new DOMMatrixReadOnly(getComputedStyle(el).transform); return [m.e, m.f]; }));
    await p.evaluate((v) => window.scrollTo(0, v), target);
    await p.waitForTimeout(1800);
    const jump = await stopSampler(p);
    const tJump = jump.find((x) => x.y >= target - 1)?.t ?? 0;
    const dist = Math.hypot(d0[0], d0[1]) || 1;
    const proj = jump.filter((x) => x.t >= tJump).map((x) => ({ t: x.t - tJump, s: (x.tx * d0[0] + x.ty * d0[1]) / (dist * dist) }));
    const overshoot = Math.max(0, -Math.min(...proj.map((x) => x.s)));
    const lastMoving = [...proj].reverse().find((x) => Math.abs(x.s) * dist > 1);
    check(`${tag} the cards overshoot the carousel slot only slightly (under 10% of the distance)`, overshoot < 0.1, `${(overshoot * 100).toFixed(1)}%`);
    check(`${tag} the cards settle within 0.8 s of the scroll stopping`, (lastMoving?.t ?? 0) < 800, `${Math.round(lastMoving?.t ?? 0)} ms`);
    check(`${tag} on arrival only the card in focus is left visible`, (await p.evaluate(() => [...document.querySelectorAll(".hiw-card")].filter((c) => parseFloat(c.querySelector(".hiw-card-travel").style.opacity || "0") * parseFloat(getComputedStyle(c.querySelector(".hiw-card-pose")).opacity) > 0.05).length)) === 1);
    check(`${tag} the carousel has taken over (arrived)`, await p.evaluate(() => document.querySelector(".hiw").hasAttribute("data-arrived")));

    // loading already inside the section: the cards are at arrival at once
    await p.evaluate((v) => window.scrollTo(0, v), target);
    await p.waitForTimeout(500);
    await p.reload({ waitUntil: "networkidle" });
    await p.waitForFunction(() => document.documentElement.getAttribute("data-preloader") !== "run", null, { timeout: 20000 });
    await p.waitForTimeout(800);
    const mid = await p.evaluate(() => {
      const hero = ["prompt", "build", "learn"].map((id) => document.querySelector(`[data-hero-card="${id}"]`));
      const el = document.querySelector(".hiw-card[data-pos='active'] .hiw-card-travel");
      const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
      return { y: window.scrollY, arrived: document.querySelector(".hiw").hasAttribute("data-arrived"), heroHidden: hero.every((c) => c.style.visibility === "hidden"), off: Math.hypot(m.e, m.f) };
    });
    check(`${tag} loading inside the section puts the cards at arrival (no travel, hero cards hidden)`, mid.y > 100 && mid.arrived && mid.heroHidden && mid.off < 1.5, JSON.stringify(mid));

    // tabbing in the middle of the travel never lands on something hidden
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.waitForTimeout(800);
    await p.evaluate((v) => window.scrollTo(0, v), Math.round(target * 0.5));
    await p.waitForTimeout(900);
    let focusOk = true;
    for (let i = 0; i < 16; i++) {
      await p.keyboard.press("Tab");
      const f = await p.evaluate(() => { const a = document.activeElement; return a && a !== document.body ? { hidden: getComputedStyle(a).visibility === "hidden", inert: !!a.closest("[inert]") } : { hidden: false, inert: false }; });
      if (f.hidden || f.inert) focusOk = false;
    }
    check(`${tag} Tab in the middle of the travel never lands on a hidden element`, focusOk);
    await p.screenshot({ path: `${shots}/handoff-3-mid-${w}.png` });

    // resizing below 768px in the middle of the travel gives the hero back and ends in the phone layout
    if (w === 1024) {
      await p.setViewportSize({ width: 700, height: 900 });
      await p.waitForTimeout(900);
      check(`${tag} resizing to a phone width restores the hero and removes the travel`, (await heroCardsClean(p)) && (await p.evaluate(() => [...document.querySelectorAll(".hiw-card-travel")].every((el) => el.style.transform === "" && el.style.opacity === ""))));
      await p.setViewportSize({ width: 1024, height: 768 });
      await p.waitForTimeout(900);
      check(`${tag} resizing back to 1024px resumes the travel with the hero cards handed off`, await p.evaluate(() => ["prompt", "build", "learn"].every((id) => document.querySelector(`[data-hero-card="${id}"]`).style.visibility === "hidden") || window.scrollY === 0));
    }
    check(`${tag} no console errors`, logs.length === 0, logs.slice(0, 2).join(" | "));
    await ctx.close();
  }
}

// ---------- Robot image: breathing, and the two tilted cards behind it ----------
const breathSample = (p) =>
  p.evaluate(() => {
    const el = document.querySelector(".hiw-breath");
    const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
    return { scale: m.a, y: m.f };
  });
async function breathOver(p, ms, every = 100) {
  const out = [];
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    out.push({ t: Date.now() - t0, ...(await breathSample(p)) });
    await p.waitForTimeout(every);
  }
  return out;
}
const spread = (v) => Math.max(...v) - Math.min(...v);

if (run("breathing")) {
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const { ctx, p, logs } = await newPage(w, h);
    const tag = `[${w}px] breathing`;
    await open(p);
    await p.locator(".hiw-robot").scrollIntoViewIfNeeded();
    await p.waitForTimeout(1200);

    // the loop: about 4 s, up to 1.02 in scale, 4 to 6 px of lift
    const run1 = await breathOver(p, 9000);
    const maxScale = Math.max(...run1.map((x) => x.scale));
    const lift = -Math.min(...run1.map((x) => x.y));
    // one rising crossing of 1.01 per breath (robust against a flat top and sampling jitter)
    const peaks = run1.filter((x, i) => i > 0 && run1[i - 1].scale < 1.01 && x.scale >= 1.01).map((x) => x.t);
    const period = peaks.length >= 2 ? (peaks.at(-1) - peaks[0]) / (peaks.length - 1) : null;
    check(`${tag} the loop lasts about 4 s`, period !== null && period >= 3500 && period <= 4500, period ? `${Math.round(period)} ms` : "no peaks found");
    check(`${tag} the image swells to at most 1.02 (and does swell)`, maxScale <= 1.0225 && maxScale >= 1.015, maxScale.toFixed(4));
    check(`${tag} it lifts 4 to 6 px`, lift >= 4 && lift <= 6.2, `${lift.toFixed(2)} px`);
    const anchor = await p.evaluate(() => {
      const el = document.querySelector(".hiw-breath");
      const o = getComputedStyle(el).transformOrigin.split(" ").map(parseFloat);
      const r = el.getBoundingClientRect();
      return { x: o[0], y: o[1], w: el.offsetWidth, h: el.offsetHeight, r: r.height };
    });
    check(`${tag} it is anchored at its feet (transform origin at the bottom centre)`, Math.abs(anchor.y - anchor.h) <= 2 && Math.abs(anchor.x - anchor.w / 2) <= 2, JSON.stringify(anchor));

    // the cards: a straight light blue one in front, a tilted saffron one behind and lower like a shadow; the robot
    // stands on the blue card with its head above it
    const shapes = await p.evaluate(() => {
      const img = document.querySelector(".hiw-breath img").getBoundingClientRect();
      const info = [...document.querySelectorAll(".hiw-shape")].map((el) => {
        const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
        const fill = el.querySelector(".hiw-shape-fill");
        const r = fill.getBoundingClientRect(); // the card itself (the wrapper is only its box)
        const wrap = el.getBoundingClientRect();
        return {
          kind: el.classList.contains("hiw-shape-saffron") ? "saffron" : "blue",
          angle: Math.round((Math.atan2(m.b, m.a) * 180) / Math.PI),
          fill: getComputedStyle(fill).backgroundColor,
          radius: parseFloat(getComputedStyle(el).borderTopLeftRadius),
          hidden: el.getAttribute("aria-hidden"),
          box: { left: wrap.left, right: wrap.right, top: r.top, bottom: wrap.bottom },
          z: [...el.parentElement.children].indexOf(el),
        };
      });
      return { info, img: { left: img.left, right: img.right, top: img.top, bottom: img.bottom, width: img.width, height: img.height } };
    });
    const blue = shapes.info.find((x) => x.kind === "blue");
    const saffron = shapes.info.find((x) => x.kind === "saffron");
    check(`${tag} two rounded cards sit behind the robot (hidden from assistive technology)`, shapes.info.length === 2 && shapes.info.every((x) => x.radius >= 16 && x.hidden === "true"), JSON.stringify(shapes.info.map((x) => x.radius)));
    check(`${tag} one is saffron`, saffron?.fill === "rgb(242, 169, 59)", saffron?.fill);
    // computed colours come back as rgb(...) or, for a colour mix, color(srgb r g b) with parts from 0 to 1
    const channels = (c) => (c.startsWith("color(") ? c.match(/[\d.]+/g).slice(-3).map((v) => Math.round(Number(v) * 255)) : c.match(/\d+/g).map(Number));
    check(`${tag} the other is a light blue`, (() => { if (!blue) return false; const [r, g, b] = channels(blue.fill); return b > 220 && b > r + 20 && g > r; })(), blue?.fill);
    check(`${tag} the blue card is straight and the saffron card is tilted`, blue?.angle === 0 && saffron && saffron.angle !== 0, `${blue?.angle}deg and ${saffron?.angle}deg`);
    // the image has 3.1% empty space under the feet, so the feet are at 96.9% of its height
    const feet = shapes.img.top + shapes.img.height * 0.969;
    // while breathing the robot lifts up to 5 px, so allow that much here; the exact contact is checked when still (below)
    check(`${tag} the robot's feet stay on the blue card's bottom edge (within the 5 px breathing lift)`, blue && Math.abs(feet - blue.box.bottom) <= 7, blue ? `feet ${feet.toFixed(1)}, card bottom ${blue.box.bottom.toFixed(1)}` : "");
    check(`${tag} the robot's head rises out of the top of the blue card`, blue && shapes.img.top < blue.box.top - 20 && shapes.img.top + shapes.img.height * 0.3 > blue.box.top - 5, blue ? `image top ${shapes.img.top.toFixed(0)}, card top ${blue.box.top.toFixed(0)}` : "");
    check(`${tag} the robot is inside the card's width`, blue && shapes.img.left >= blue.box.left && shapes.img.right <= blue.box.right);
    check(`${tag} the saffron card sits lower than the blue one (like a shadow under it) and behind it`, blue && saffron && saffron.box.bottom - blue.box.bottom >= 6 && saffron.z < blue.z, blue && saffron ? `${(saffron.box.bottom - blue.box.bottom).toFixed(1)} px lower` : "");
    check(`${tag} no horizontal scroll`, await noHScroll(p));
    await shotSection(p, `breathing-${w}.png`);

    // it stops off screen and starts again
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.waitForTimeout(1500);
    const away = await breathOver(p, 3000);
    check(`${tag} it stops while the section is off screen`, spread(away.map((x) => x.scale)) < 0.0005 && spread(away.map((x) => x.y)) < 0.2);
    await p.locator(".hiw-robot").scrollIntoViewIfNeeded();
    const back = await breathOver(p, 2500);
    check(`${tag} it starts again when the section is back on screen`, spread(back.map((x) => x.scale)) > 0.004);
    check(`${tag} no console errors`, logs.length === 0, logs.slice(0, 2).join(" | "));
    await ctx.close();
  }

  // reduced motion: the image and the cards are still
  const still = await newPage(1440, 900, { reducedMotion: true });
  await open(still.p);
  await still.p.locator(".hiw-robot").scrollIntoViewIfNeeded();
  await still.p.waitForTimeout(1000);
  const quiet = await breathOver(still.p, 4000);
  check(`[1440px] breathing: with reduced motion the image is still`, spread(quiet.map((x) => x.scale)) < 0.0005 && spread(quiet.map((x) => x.y)) < 0.2);
  check(`[1440px] breathing: with reduced motion the two cards are still there`, (await still.p.locator(".hiw-shape").count()) === 2);
  const rest = await still.p.evaluate(() => {
    const img = document.querySelector(".hiw-breath img").getBoundingClientRect();
    const card = document.querySelector(".hiw-shape-blue").getBoundingClientRect();
    return { feet: img.top + img.height * 0.969, bottom: card.bottom };
  });
  check(`[1440px] breathing: at rest the robot's feet touch the blue card's bottom edge exactly`, Math.abs(rest.feet - rest.bottom) <= 2.5, `feet ${rest.feet.toFixed(1)}, card bottom ${rest.bottom.toFixed(1)}`);
  await still.ctx.close();
}

// ---------- Reduced motion: nothing moves by itself; the slide and flip still animate when used ----------
if (run("reduced-motion")) {
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const { ctx, p, logs } = await newPage(w, h, { reducedMotion: true });
    const tag = `[${w}px] reduced motion`;
    await open(p);
    const target = await arrivalY(p);

    // scroll through: the hero's cards are never hidden and no card travels
    await startSampler(p);
    await scrollSteps(p, 0, target, 25);
    await p.waitForTimeout(600);
    await scrollSteps(p, target, 0, 25);
    const samples = await stopSampler(p);
    check(`${tag} the hero's cards are never hidden (no travel)`, samples.every((x) => x.heroHidden === 0), `${samples.length} frames`);
    check(`${tag} no card has a travel transform`, await p.evaluate(() => [...document.querySelectorAll(".hiw-card-travel")].every((el) => el.style.transform === "" && el.style.opacity === "")));
    check(`${tag} no horizontal scroll`, await noHScroll(p));

    // the carousel is there, at rest: no auto-advance
    await showCarousel(p);
    await p.mouse.move(5, 300);
    const i0 = await activeIndex(p);
    check(`${tag} the carousel shows one card`, i0 >= 0 && (await p.locator(".hiw-controls button").count()) === 5);
    check(`${tag} auto-advance never runs (12 s)`, (await changeWithin(p, i0, 12000)) === null);

    // the slide and the flip still animate when the visitor acts
    const durations = await p.evaluate(() => ({ pose: getComputedStyle(document.querySelector(".hiw-card-pose")).transitionDuration, flip: getComputedStyle(document.querySelector(".hiw-card-flip")).transitionDuration }));
    check(`${tag} the slide and flip keep their transition times`, durations.pose !== "0.01ms" && durations.flip !== "0.01ms", JSON.stringify(durations));
    await p.click('.hiw-controls button[aria-label="Next step"]');
    await p.waitForTimeout(80);
    check(`${tag} Next slides the cards with a running animation`, await p.evaluate(() => [...document.querySelectorAll(".hiw-card-pose")].some((el) => el.getAnimations().length > 0)));
    await p.waitForTimeout(500);
    await p.locator(".hiw-card[data-pos='active'] .hiw-face-front .hiw-flip-btn").click();
    await p.waitForTimeout(80);
    check(`${tag} the flip runs as an animation`, await p.evaluate(() => [...document.querySelectorAll(".hiw-card-flip")].some((el) => el.getAnimations().length > 0)));
    check(`${tag} no console errors`, logs.length === 0, logs.slice(0, 2).join(" | "));
    await shotSection(p, `still-${w}.png`);
    await ctx.close();
  }
}

// ---------- Phones: the carousel fades and rises in; nothing travels ----------
if (run("phone")) {
  for (const [w, h] of [[360, 740], [390, 844]]) {
    const { ctx, p, logs } = await newPage(w, h);
    const tag = `[${w}px] phone`;
    await open(p);
    check(`${tag} the carousel starts hidden below the fold, ready to fade in`, await p.evaluate(() => { const el = document.querySelector(".hiw-carousel"); return el.hasAttribute("data-reveal") && !el.hasAttribute("data-revealed") && getComputedStyle(el).opacity === "0"; }));
    const target = await arrivalY(p);
    await startSampler(p);
    await scrollSteps(p, 0, target, 25);
    await p.waitForTimeout(1200);
    const samples = await stopSampler(p);
    check(`${tag} it fades in once the section is on screen`, await p.evaluate(() => getComputedStyle(document.querySelector(".hiw-carousel")).opacity === "1"));
    check(`${tag} the hero's cards never move or hide (no travel)`, samples.every((x) => x.heroHidden === 0));
    check(`${tag} no horizontal scroll`, await noHScroll(p));
    const small = await p.locator(".hiw-controls button").evaluateAll((els) => els.filter((e) => { const r = e.getBoundingClientRect(); return r.width < 43.5 || r.height < 43.5; }).length);
    check(`${tag} every control is at least 44px`, small === 0);
    check(`${tag} the card fits the screen width`, await p.evaluate(() => { const r = document.querySelector(".hiw-card[data-pos='active']").getBoundingClientRect(); return r.left >= 0 && r.right <= window.innerWidth; }));
    check(`${tag} no console errors`, logs.length === 0, logs.slice(0, 2).join(" | "));
    await shotSection(p, `phone-${w}.png`);
    await ctx.close();
  }
}

// ---------- Tablet widths (768 to 1023): the travel in the stacked layout ----------
if (run("tablet")) {
  for (const [w, h] of [[768, 1024], [1000, 800]]) {
    const { ctx, p, logs } = await newPage(w, h);
    const tag = `[${w}x${h}] tablet`;
    await open(p);
    const target = await arrivalY(p);
    await scrollSteps(p, 0, target, 25);
    await p.waitForTimeout(1500);
    const m = await p.evaluate(() => {
      const r = document.querySelector(".hiw-card[data-pos='active']").getBoundingClientRect();
      return { arrived: document.querySelector(".hiw").hasAttribute("data-arrived"), top: r.top, bottom: r.bottom, vh: window.innerHeight };
    });
    check(`${tag} the cards arrive in the stacked layout`, m.arrived);
    check(`${tag} the card in focus is fully on screen once arrived`, m.top >= 70 && m.bottom <= m.vh, JSON.stringify(m));
    check(`${tag} no horizontal scroll`, await noHScroll(p));
    await p.screenshot({ path: `${shots}/tablet-arrived-${w}.png` });
    check(`${tag} no console errors`, logs.length === 0, logs.slice(0, 2).join(" | "));
    await ctx.close();
  }
}

// Sections for the carousel, hand-off, phone, still, tablet and breathing stories are added by their tasks.

await b.close();
console.log(results.join("\n"));
const failed = results.filter((r) => r.startsWith("FAIL")).length;
console.log(`\n${results.length - failed} passed, ${failed} failed`);
process.exitCode = failed ? 1 : 0;

// keep helpers referenced for the sections added later
void [existsSync, readFileSync, near, heroCardsClean];
