// Behaviour, layout and loading checks for the "How it works" video stepper (feature 013).
// Needs a browser with H.264 (Playwright's bundled Chromium has none).
// Usage: npm run build && npx next start -p 3100, then:
//   CHROME="C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" BASE=http://localhost:3100 node scripts/how-it-works-check.mjs
import { chromium } from "@playwright/test";

const base = process.env.BASE ?? "http://localhost:3100";
const browser = await chromium.launch({ executablePath: process.env.CHROME });
let failures = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail !== "" ? `  (${detail})` : ""}`);
};

const SECTION = "#how-it-works";
const open = async (options = {}, init) => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, ...options });
  const p = await ctx.newPage();
  if (init) await p.addInitScript(init);
  await p.goto(base + "/", { waitUntil: "load" });
  await p.waitForTimeout(2500); // the preloader
  return { ctx, p };
};
const toSection = async (p) => {
  await p.locator(`${SECTION} .tablet`).scrollIntoViewIfNeeded();
  await p.waitForTimeout(800);
};
const state = (p) =>
  p.evaluate((sel) => {
    const videos = [...document.querySelectorAll(`${sel} video`)];
    const cards = [...document.querySelectorAll(`${sel} .step-card`)];
    return {
      active: cards.findIndex((c) => c.getAttribute("aria-current") === "step"),
      cards: cards.map((c) => c.dataset.state),
      playing: videos.flatMap((v, i) => (v.paused ? [] : [i])),
      times: videos.map((v) => v.currentTime),
      layer: [...document.querySelectorAll(`${sel} .step-layer`)].findIndex((l) => l.hasAttribute("data-active")),
    };
  }, SECTION);
const until = async (p, test, timeout = 12000) => {
  const end = Date.now() + timeout;
  let s;
  do {
    s = await state(p);
    if (test(s)) return s;
    await p.waitForTimeout(50);
  } while (Date.now() < end);
  return s;
};
// jump the active video to just before its end, so the check does not wait 6 s per step
const nearEnd = async (p, i) => {
  // with preload="none" the duration is unknown until the video has started loading
  await p.waitForFunction(([sel, i]) => document.querySelectorAll(`${sel} video`)[i].duration > 0, [SECTION, i], { timeout: 15000 });
  return p.evaluate(
    ([sel, i]) => {
      const v = document.querySelectorAll(`${sel} video`)[i];
      v.currentTime = Math.max(0, v.duration - 0.25);
    },
    [SECTION, i],
  );
};

// ---- US3: nothing loads until the visitor nears the section (runs first, on a fresh page) ----
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();
  const media = [];
  p.on("request", (r) => {
    if (/\/videos\/how-it-works\/|tablet-screen/.test(r.url())) media.push(r.url());
  });
  await p.goto(base + "/", { waitUntil: "load" });
  await p.waitForTimeout(3000);
  check("US3 no video, poster or frame request at the top of the page", media.length === 0, media.join(", "));
  const preload = await p.locator(`${SECTION} video`).evaluateAll((vs) => vs.map((v) => v.preload));
  check('US3 videos stay preload="none" away from the section', preload.every((v) => v === "none"), preload.join(","));
  await toSection(p);
  await p.waitForTimeout(500);
  check("US3 media loads once the section is near", media.some((u) => u.includes(".mp4")));
  await ctx.close();
}

// ---- US1: the loop ----
{
  const { ctx, p } = await open();
  await toSection(p);
  let s = await until(p, (x) => x.playing.includes(0));
  check("US1 Learn plays first, its card is current", s.playing.join() === "0" && s.active === 0 && s.cards.join() === "active,idle,idle", JSON.stringify(s));

  const fade = await p.locator(`${SECTION} .step-layer`).first().evaluate((el) => getComputedStyle(el).transitionDuration);
  check("US1 the cross-fade lasts about 400 ms", fade === "0.4s", fade);

  const barBefore = await p.locator(`${SECTION} .step-progress-bar`).first().evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a);
  await p.waitForTimeout(600);
  const barAfter = await p.locator(`${SECTION} .step-progress-bar`).first().evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a);
  check("US1 the progress bar follows the video", barAfter > barBefore, `${barBefore.toFixed(3)} -> ${barAfter.toFixed(3)}`);

  const order = [0];
  for (const from of [0, 1, 2]) {
    await nearEnd(p, from);
    const expected = (from + 1) % 3;
    s = await until(p, (x) => x.active === expected);
    order.push(s.active);
    check(`US1 card and fade switch together after step ${from + 1}`, s.layer === s.active, JSON.stringify(s));
    if (expected === 1) check("US1 step 1 shows a check while step 2 plays", s.cards.join() === "done,active,idle", s.cards.join());
    if (expected === 2) check("US1 steps 1 and 2 show checks while step 3 plays", s.cards.join() === "done,done,active", s.cards.join());
    if (expected === 0) check("US1 the checks clear when the loop returns to Learn", s.cards.join() === "active,idle,idle", s.cards.join());
    s = await until(p, (x) => x.playing.includes(expected));
    check(`US1 only step ${expected + 1}'s video runs`, s.playing.join() === String(expected), s.playing.join());
  }
  check("US1 order Learn, Prompt, Build, Learn", order.join() === "0,1,2,0", order.join());
  const attrs = await p.locator(`${SECTION} video`).evaluateAll((vs) => vs.every((v) => v.muted && v.playsInline && !v.controls));
  check("US1 videos are muted, inline and without controls", attrs);

  // ---- US2: jump to a step ----
  await p.waitForTimeout(800);
  await p.locator(`${SECTION} .step-card`).nth(2).click();
  s = await until(p, (x) => x.active === 2 && x.playing.includes(2));
  check("US2 click: step 3 from the start, steps 1 and 2 checked", s.active === 2 && s.times[2] < 1 && s.cards.join() === "done,done,active", JSON.stringify(s));

  await p.locator(`${SECTION} .step-card`).nth(1).focus();
  const ring = await p.locator(`${SECTION} .step-card`).nth(1).evaluate((el) => el.matches(":focus"));
  await p.keyboard.press("Enter");
  s = await until(p, (x) => x.active === 1 && x.playing.includes(1));
  check("US2 Enter on a focused card jumps to it", ring && s.active === 1 && s.times[1] < 1, JSON.stringify(s));

  await p.locator(`${SECTION} .step-card`).nth(0).focus();
  await p.keyboard.press("Space");
  s = await until(p, (x) => x.active === 0 && x.playing.includes(0));
  check("US2 Space on a focused card jumps to it", s.active === 0 && s.times[0] < 1, JSON.stringify(s));

  await p.waitForTimeout(1500);
  await p.locator(`${SECTION} .step-card`).nth(0).click();
  await p.waitForTimeout(150);
  s = await state(p);
  check("US2 clicking the current card restarts it", s.times[0] < 1, s.times[0].toFixed(2));

  for (const i of [0, 1, 2]) await p.locator(`${SECTION} .step-card`).nth(i).click({ delay: 0 });
  await p.waitForTimeout(700);
  s = await state(p);
  check("US2 rapid clicks leave only the last step running", s.active === 2 && s.playing.join() === "2" && s.layer === 2, JSON.stringify(s));

  // ---- US3: pause and resume ----
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.waitForTimeout(600);
  s = await state(p);
  check("US3 scrolled away: nothing plays", s.playing.length === 0, s.playing.join());
  const held = s.times[2];
  await toSection(p);
  s = await until(p, (x) => x.playing.includes(2));
  check("US3 scrolled back: it resumes where it was", s.playing.join() === "2" && s.times[2] >= held, `${held.toFixed(2)} -> ${s.times[2].toFixed(2)}`);

  await p.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await p.waitForTimeout(300);
  s = await state(p);
  check("US3 tab hidden: nothing plays", s.playing.length === 0, s.playing.join());
  await p.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  s = await until(p, (x) => x.playing.length === 1);
  check("US3 tab visible again: it resumes", s.playing.length === 1, s.playing.join());
  await ctx.close();
}

// ---- US3: a video that cannot load does not freeze the section ----
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();
  await p.route("**/videos/how-it-works/learn.mp4", (r) => r.abort());
  await p.goto(base + "/", { waitUntil: "load" });
  await p.waitForTimeout(2500);
  await toSection(p);
  const s = await until(p, (x) => x.active === 1, 15000);
  check("US3 a failed video: the sequence still moves on", s.active === 1, JSON.stringify(s));
  await ctx.close();
}

// ---- US4: reduced motion, Save-Data, blocked autoplay ----
const manualCase = async (name, options, init) => {
  const { ctx, p } = await open(options, init);
  await toSection(p);
  await p.waitForTimeout(800);
  let s = await state(p);
  check(`US4 ${name}: nothing plays by itself`, s.playing.length === 0, s.playing.join());
  const poster = await p.locator(`${SECTION} .step-layer[data-active] img`).evaluate((img) => img.complete && img.naturalWidth > 0);
  check(`US4 ${name}: the active step's poster shows`, poster);
  const play = p.locator(`${SECTION} .tablet-play`);
  check(`US4 ${name}: a play button shows`, (await play.count()) === 1);
  return { ctx, p, play };
};
{
  const { ctx, p, play } = await manualCase("reduced motion", { reducedMotion: "reduce" });
  await p.locator(`${SECTION} .step-card`).nth(1).click();
  await p.waitForTimeout(300);
  let s = await state(p);
  check("US4 a card shows its step without playing", s.active === 1 && s.playing.length === 0, JSON.stringify(s));
  await play.click();
  s = await until(p, (x) => x.playing.includes(1));
  check("US4 the play button plays that step", s.playing.join() === "1" && s.active === 1, JSON.stringify(s));
  check("US4 the button is hidden while it plays", (await play.count()) === 0);
  await nearEnd(p, 1);
  await p.waitForTimeout(1200);
  s = await state(p);
  check("US4 at the end it stays on the step, no auto-advance", s.active === 1 && s.playing.length === 0, JSON.stringify(s));
  check("US4 the play button comes back", (await play.count()) === 1);
  await ctx.close();
}
{
  const media = [];
  const { ctx, p } = await manualCase("Save-Data", {}, () => {
    Object.defineProperty(navigator, "connection", { configurable: true, value: { saveData: true, addEventListener() {}, removeEventListener() {} } });
  });
  p.on("request", (r) => {
    if (r.url().includes(".mp4")) media.push(r.url());
  });
  await p.waitForTimeout(800);
  check("US4 Save-Data: no video bytes until play is pressed", media.length === 0, media.join(","));
  await ctx.close();
}
{
  const { ctx } = await manualCase("blocked autoplay", {}, () => {
    HTMLMediaElement.prototype.play = () => Promise.reject(new DOMException("blocked", "NotAllowedError"));
  });
  await ctx.close();
}

// ---- the owner's order ----
{
  const { ctx, p } = await open();
  const names = await p.locator(`${SECTION} .step-name`).allTextContents();
  check("order on screen is Learn, Prompt, Build", names.join() === "Learn,Prompt,Build", names.join());
  await ctx.close();
}

// ---- desktop: the whole section fits one screen, below the sticky header ----
for (const [w, h] of [[1024, 600], [1280, 640], [1366, 650], [1366, 768], [1440, 900], [1920, 1080]]) {
  const { ctx, p } = await open({ viewport: { width: w, height: h } });
  const m = await p.evaluate((sel) => ({
    section: document.querySelector(sel).getBoundingClientRect().height,
    header: document.querySelector("header").getBoundingClientRect().height,
  }), SECTION);
  check(`fit ${w}x${h}: section fits under the header`, m.section + m.header <= h + 0.5, `${m.section.toFixed(0)} + ${m.header} / ${h}`);
  await ctx.close();
}

// ---- US5: layout ----
for (const [w, h] of [[360, 740], [768, 1024], [1280, 800]]) {
  const { ctx, p } = await open({ viewport: { width: w, height: h } });
  await toSection(p);
  const m = await p.evaluate((sel) => {
    const box = (q) => document.querySelector(q).getBoundingClientRect();
    const cards = [...document.querySelectorAll(`${sel} .step-card`)].map((c) => c.getBoundingClientRect());
    return {
      scroll: document.documentElement.scrollWidth,
      inner: window.innerWidth,
      tablet: box(`${sel} .tablet`),
      player: box(`${sel} .hiw-player`),
      list: box(`${sel} .step-list`),
      cards: cards.map((c) => ({ x: c.x, y: c.y, h: c.height, w: c.width })),
    };
  }, SECTION);
  check(`US5 ${w}px no horizontal scroll`, m.scroll <= m.inner, `${m.scroll} / ${m.inner}`);
  check(`US5 ${w}px every card is at least 44px tall`, m.cards.every((c) => c.h >= 44), m.cards.map((c) => c.h.toFixed(0)).join(","));
  if (w >= 1024) {
    const share = m.tablet.width / m.player.width;
    // 60% unless the screen is too short for it; then the height cap wins (fit check above)
    check(`US5 ${w}px tablet is at most about 60% wide, on the left`, share < 0.65 && m.tablet.right <= m.list.left, share.toFixed(2));
    check(`US5 ${w}px cards are stacked`, m.cards[0].y < m.cards[1].y && m.cards[1].y < m.cards[2].y && m.cards[0].x === m.cards[2].x);
  } else {
    check(`US5 ${w}px tablet on top, full width`, m.tablet.bottom <= m.list.top && Math.abs(m.tablet.width - m.player.width) < 1);
    check(`US5 ${w}px cards in one row`, m.cards[0].y === m.cards[2].y && m.cards[0].x < m.cards[1].x);
  }
  // nothing moves between steps, and the panel holds the longest text
  const heights = [];
  const overflow = [];
  for (const i of [0, 1, 2]) {
    await p.locator(`${SECTION} .step-card`).nth(i).click();
    await p.waitForTimeout(100);
    heights.push(await p.locator(`${SECTION} .step-list`).evaluate((el) => el.getBoundingClientRect().height));
    overflow.push(
      await p.evaluate((sel) => {
        const list = document.querySelector(`${sel} .step-list`).getBoundingClientRect();
        const detail = document.querySelector(`${sel} .step-card[data-state="active"] .step-detail`).getBoundingClientRect();
        return detail.bottom <= list.bottom + 0.5;
      }, SECTION),
    );
  }
  check(`US5 ${w}px the list height does not change between steps`, new Set(heights).size === 1, heights.join(","));
  check(`US5 ${w}px the detail fits inside the list`, overflow.every(Boolean));
  await p.locator(`${SECTION}`).screenshot({ path: `shots/013/section-${w}.png` }).catch(() => {});
  await ctx.close();
}

await browser.close();
console.log(failures ? `\n${failures} FAILED` : "\nALL PASSED");
process.exit(failures ? 1 : 0);
