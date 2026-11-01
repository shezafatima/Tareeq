// Brand preloader checks. Usage:
//   CHROME=<path> BASE=http://localhost:3100 node scripts/preloader-check.mjs [smoke|frames|timing|preview|skip|a11y|all]
// Needs a running production server (npm run build, then next start -p 3100).
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const base = process.env.BASE ?? "http://localhost:3100";
const which = process.argv[2] ?? "all";
const SEQ = 6000; // ms, the sequence length (must match --pl-seq in preloader.css)
const results = [];
const check = (name, ok, extra = "") => results.push(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  (" + extra + ")" : ""}`);
const want = (s) => which === "all" || which === s;
const browser = await chromium.launch({ executablePath: process.env.CHROME });

// Records the overlay's state on every animation frame from the first frame until the page has loaded
const SAMPLER = () => {
  window.__pl = [];
  const t0 = performance.now();
  window.__t0 = t0;
  window.__cls = 0;
  window.__lcp = null;
  window.addEventListener("load", () => { window.__loadAt = Math.round(performance.now() - t0); window.__loadAbs = performance.now(); });
  try {
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = { t: Math.round(e.startTime), tag: e.element ? e.element.tagName : null, src: e.url || "", text: e.element ? (e.element.textContent || "").trim().slice(0, 30) : "" }; }).observe({ type: "largest-contentful-paint", buffered: true });
  } catch (e) { /* observers unavailable */ }
  const tick = () => {
    const el = document.getElementById("preloader");
    const cs = el ? getComputedStyle(el) : null;
    let rootAnim = null;
    if (el) { const ra = el.getAnimations().find((x) => x.effect && x.effect.target === el); if (ra) rootAnim = { name: ra.animationName, start: ra.startTime, endTime: ra.effect.getComputedTiming().endTime }; }
    window.__pl.push({
      tl: performance.now(),
      rootAnim,
      t: Math.round(performance.now() - t0),
      state: document.documentElement.getAttribute("data-preloader"),
      display: cs ? cs.display : "none",
      opacity: cs ? parseFloat(cs.opacity) : 0,
    });
    if (window.__pl.length < 4000) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

async function open(path, { width = 390, height = 844, init, ctxOptions = {} } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, ...ctxOptions });
  const page = await ctx.newPage();
  const logs = [];
  page.on("console", (m) => { if (["error", "warning"].includes(m.type())) logs.push(m.text()); });
  page.on("pageerror", (e) => logs.push(e.message));
  await page.addInitScript(SAMPLER);
  if (init) await page.addInitScript(init);
  await page.goto(base + path, { waitUntil: "load" });
  return { ctx, page, logs };
}

// ---------------------------------------------------------------- smoke
if (want("smoke")) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const logs = [];
  page.on("console", (m) => { if (["error", "warning"].includes(m.type())) logs.push(m.text()); });
  page.on("pageerror", (e) => logs.push(e.message));
  await page.addInitScript(SAMPLER);
  await page.goto(base + "/", { waitUntil: "domcontentloaded" });
  const early = await page.evaluate(() => {
    const el = document.getElementById("preloader");
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return { state: document.documentElement.getAttribute("data-preloader"), display: cs.display, position: cs.position, bg: cs.backgroundColor, w: Math.round(r.width), h: Math.round(r.height), ariaHidden: el.getAttribute("aria-hidden"), pe: cs.pointerEvents };
  });
  check("[/] overlay is shown at the start (data-preloader=run, display flex)", early.state === "run" && early.display === "flex", JSON.stringify({ s: early.state, d: early.display }));
  check("[/] overlay is fixed, full-screen, plain white, aria-hidden, not clickable", early.position === "fixed" && early.w === 390 && early.h === 844 && early.bg === "rgb(255, 255, 255)" && early.ariaHidden === "true" && early.pe === "none", JSON.stringify(early));
  const html = await (await ctx.request.get(base + "/")).text();
  const inline = html.match(/<script>\(function[^<]*data-preloader[^<]*<\/script>/);
  check("[/] inline script is present in the page HTML", !!inline, inline ? `${inline[0].length} chars` : "not found");
  await page.waitForTimeout(3000);
  const mid = await page.evaluate(() => { const cs = getComputedStyle(document.getElementById("preloader")); return { display: cs.display, opacity: parseFloat(cs.opacity) }; });
  check("[/] about 3 s in, the overlay is still fully showing (it stays at least 6 s)", mid.display === "flex" && mid.opacity > 0.99, JSON.stringify(mid));
  await page.waitForTimeout(4300);
  const late = await page.evaluate(() => { const cs = getComputedStyle(document.getElementById("preloader")); return { display: cs.display, opacity: parseFloat(cs.opacity) }; });
  check("[/] the overlay has gone (hidden or faded out) by 7.5 s", late.display === "none" || late.opacity === 0, JSON.stringify(late));
  const first = await page.evaluate(() => window.__pl.find((s) => s.display === "flex"));
  check("[/] the first frame that shows the page already shows the overlay (displayed and opaque)", !!first && first.opacity === 1, JSON.stringify(first && { t: first.t, d: first.display, o: first.opacity }));
  check("[/] no console errors or warnings (including hydration)", logs.length === 0, logs.join(" | ").slice(0, 200));
  await ctx.close();

  const demo = await open("/gradient-demo");
  const d = await demo.page.evaluate(() => ({ el: !!document.getElementById("preloader"), state: document.documentElement.getAttribute("data-preloader") }));
  check("[/gradient-demo] no overlay and no state (route is outside the shell)", !d.el && d.state === null, JSON.stringify(d));
  await demo.ctx.close();
}

// ---------------------------------------------------------------- frames
// Freeze the overlay's animations at exact times so screenshots and measurements are deterministic.
const freeze = (page, t) =>
  page.evaluate((t) => {
    for (const a of document.getAnimations()) {
      const tgt = a.effect && a.effect.target;
      if (!tgt || !tgt.closest) continue;
      a.pause();
      a.currentTime = tgt.id === "preloader" ? 0 : t; // keep the hard-maximum fade in its delay
    }
  }, t);

const geometry = () => {
  const r = (el) => { const b = el.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; };
  const head = r(document.querySelector('[data-part="head"]'));
  const bar = r(document.querySelector('[data-part="progress"]'));
  const win = document.querySelector(".pl-reveal").getBoundingClientRect();
  const fade = parseFloat(getComputedStyle(document.querySelector(".pl-progress")).getPropertyValue("--pl-fade"));
  const eyes = [...document.querySelectorAll(".pl-eye-open")].map(r);
  const happy = [...document.querySelectorAll(".pl-eye-happy")].map((el) => ({ ...r(el), op: parseFloat(getComputedStyle(el).opacity) }));
  const open = [...document.querySelectorAll(".pl-eye-open")].map((el) => parseFloat(getComputedStyle(el).opacity));
  const img = document.querySelector('[data-part="head"] img');
  const last = parseFloat(getComputedStyle(document.querySelector(".pl-row.pl-last")).opacity);
  const gt = getComputedStyle(document.querySelector(".pl-gaze")).transform;
  const gaze = gt && gt !== "none" ? new DOMMatrix(gt).m41 : 0; // sideways shift of the eye pair, in the eye SVG's own units
  const ib = img ? img.getBoundingClientRect() : null;
  return {
    head, bar, eyes, happy, open, last, gaze,
    fill: Math.max(0, Math.min(1, (win.right - bar.x - fade) / bar.w)),
    img: img ? { w: ib.width, h: ib.height, nw: Math.round(img.naturalWidth * devicePixelRatio), nh: Math.round(img.naturalHeight * devicePixelRatio), ok: img.complete } : null, // natural size is divided by the density of the chosen candidate (2x), so scale it back
    text: document.getElementById("preloader").innerText.trim(),
  };
};

async function frozenPage(width, height, t, scale = 2) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale });
  const page = await ctx.newPage();
  // Test only: keep the overlay frozen by switching off the load listener and the 7 s backup timer
  await page.addInitScript(() => {
    const add = window.addEventListener.bind(window);
    window.addEventListener = (type, ...rest) => (type === "load" ? undefined : add(type, ...rest));
    const st = window.setTimeout.bind(window);
    window.setTimeout = (fn, delay, ...rest) => (delay === 7000 ? 0 : st(fn, delay, ...rest));
  });
  await page.goto(base + "/", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.documentElement.getAttribute("data-preloader") === "run" && document.getAnimations().length > 0);
  await page.waitForFunction(() => { const i = document.querySelector('[data-part="head"] img'); return i && i.complete; }, null, { timeout: 5000 }).catch(() => {});
  await freeze(page, t);
  return { ctx, page };
}

if (want("frames")) {
  mkdirSync("shots/preloader", { recursive: true });
  // Seven steps (fractions of the 6 s sequence): normal, happy, normal, curious (left, right), normal, wink, normal
  const steps = {
    normal: (g) => g.open.every((o) => o > 0.99) && g.happy.every((e) => e.op < 0.01) && Math.abs(g.gaze) < 0.5,
    happy: (g) => g.open.every((o) => o < 0.01) && g.happy.every((e) => e.op > 0.99),
    "curious-left": (g) => g.open.every((o) => o > 0.99) && g.happy.every((e) => e.op < 0.01) && g.gaze < -3,
    "curious-right": (g) => g.open.every((o) => o > 0.99) && g.happy.every((e) => e.op < 0.01) && g.gaze > 3,
    wink: (g) => g.open[0] > 0.99 && g.happy[0].op < 0.01 && g.open[1] < 0.01 && g.happy[1].op > 0.99,
  };
  const shots = [
    ["bar-0pct", 0, null],
    ["expression-1-normal", 0.06, "normal"],
    ["expression-2-happy", 0.22, "happy"],
    ["expression-3-normal", 0.36, "normal"],
    ["expression-4a-curious-left", 0.46, "curious-left"],
    ["expression-4b-curious-right", 0.54, "curious-right"],
    ["expression-5-normal", 0.64, "normal"],
    ["expression-6-wink", 0.75, "wink"],
    ["expression-7-normal-final", 0.92, "normal"],
    ["bar-50pct", 0.45, null],
    ["bar-100pct", 0.92, null],
  ].map(([name, f, step]) => [name, Math.round(f * SEQ), step]);
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const { ctx, page } = await frozenPage(w, h, 0);
    for (const [name, t, step] of shots) {
      await freeze(page, t);
      await page.waitForTimeout(80);
      const g = await page.evaluate(geometry);
      const pad = 28;
      const clip = { x: Math.max(0, Math.min(g.head.x, g.bar.x) - pad), y: Math.max(0, g.head.y - pad), width: Math.max(g.head.w, g.bar.w) + pad * 2, height: g.bar.y + g.bar.h - g.head.y + pad * 2 };
      await page.screenshot({ path: `shots/preloader/${name}-${w}.png`, clip });
      const pct = `${(g.fill * 100).toFixed(0)}%`;
      if (name === "bar-0pct") check(`[${w}px] chevron bar at t=0 is 0% filled`, g.fill < 0.02, pct);
      if (name === "bar-50pct") check(`[${w}px] chevron bar at 45% of the sequence is about half filled (40 to 70%)`, g.fill >= 0.4 && g.fill <= 0.7, pct);
      if (name === "bar-100pct") {
        check(`[${w}px] chevron bar at 92% of the sequence is 100% filled`, g.fill > 0.99, pct);
        check(`[${w}px] last chevron is brightening at 92% of the sequence`, g.last > 0.3, `opacity ${g.last.toFixed(2)}`);
      }
      if (step) check(`[${w}px] ${name} at ${Math.round((t / SEQ) * 100)}% of the sequence is ${step}`, steps[step](g), JSON.stringify({ open: g.open.map((o) => +o.toFixed(2)), happy: g.happy.map((e) => +e.op.toFixed(2)), gaze: +g.gaze.toFixed(1) }));
    }
    const g = await page.evaluate(geometry);
    check(`[${w}px] no text anywhere in the overlay`, g.text === "", JSON.stringify(g.text));
    check(`[${w}px] head image loaded and keeps its proportions (241 x 195)`, !!g.img && g.img.ok && Math.abs(g.img.nw - 241) <= 2 && Math.abs(g.img.nh - 195) <= 2 && Math.abs(g.img.w / g.img.h - 241 / 195) < 0.01, JSON.stringify(g.img));
    await ctx.close();
  }

  // Every change of shape must be a clean swap: scan the whole sequence and, for each eye, find the moment where the
  // open pill and the arc are both visible at once. Also time how long the first swap takes.
  {
    const { ctx, page } = await frozenPage(1440, 900, 0, 1);
    let worst = 0, worstAt = 0, worstEye = "", samples = 0;
    for (let f = 0.1; f <= 0.88; f += 0.002) {
      const t = Math.round(f * SEQ);
      await freeze(page, t);
      const g = await page.evaluate(geometry);
      samples++;
      for (const [eye, i] of [["left", 0], ["right", 1]]) {
        const overlap = Math.min(g.open[i], g.happy[i].op);
        if (overlap > worst) { worst = overlap; worstAt = t; worstEye = eye; }
      }
    }
    check("[swap] over the whole sequence (every swap, both eyes) the old and new shape are never both clearly visible (peak overlap 10% or less)", worst <= 0.1, `peak overlap ${(worst * 100).toFixed(1)}% (${worstEye} eye, ${worstAt} ms), ${samples} moments scanned`);
    let mid = 0;
    for (let f = 0.11; f <= 0.17; f += 0.001) {
      await freeze(page, Math.round(f * SEQ));
      const g = await page.evaluate(geometry);
      if (g.open[0] < 0.99 && g.happy[0].op < 0.99) mid += 0.001 * SEQ;
    }
    check("[swap] the first swap takes about 0.2 s or less in all (time with neither shape fully shown)", mid <= 260, `${Math.round(mid)} ms`);
    // only the right eye winks: at the wink the left eye is untouched
    await freeze(page, Math.round(0.75 * SEQ));
    const w2 = await page.evaluate(geometry);
    check("[swap] at the wink only the right eye changes: the left eye stays an open pill", w2.open[0] > 0.99 && w2.happy[0].op < 0.01 && w2.open[1] < 0.01 && w2.happy[1].op > 0.99);
    await ctx.close();
  }

  // Eyes stay inside the visor at every width (visor numbers from visor.ts), with a debug outline screenshot
  for (const [w, h] of [[360, 740], [390, 844], [768, 1024], [1440, 900]]) {
    const { ctx, page } = await frozenPage(w, h, Math.round((150 / 1200) * SEQ));
    const g = await page.evaluate(geometry);
    const V = { cx: 50.22, cy: 57.74, w: 69.32, h: 62.11 }; // visor.ts
    const vx = g.head.x + (V.cx / 100) * g.head.w, vy = g.head.y + (V.cy / 100) * g.head.h;
    const vw = (V.w / 100) * g.head.w, vh = (V.h / 100) * g.head.h;
    const inset = 0.04 * vh;
    const inside = g.eyes.every((e) => e.x >= vx - vw / 2 + inset - 0.5 && e.x + e.w <= vx + vw / 2 - inset + 0.5 && e.y >= vy - vh / 2 + inset - 0.5 && e.y + e.h <= vy + vh / 2 - inset + 0.5);
    check(`[${w}px] both eyes are inside the visor (inset by the clip margin)`, inside, `visor ${Math.round(vw)}x${Math.round(vh)} px, head ${Math.round(g.head.w)} px wide`);
    const pairCx = (g.eyes[0].x + g.eyes[1].x + g.eyes[1].w) / 2;
    const pairCy = g.eyes[0].y + g.eyes[0].h / 2;
    check(`[${w}px] eye pair is centred on the visor`, Math.abs(pairCx - vx) < 1.5 && Math.abs(pairCy - vy) < 1.5, `dx ${(pairCx - vx).toFixed(2)}, dy ${(pairCy - vy).toFixed(2)}`);
    // and while looking left and right (the widest the eyes ever move)
    for (const [label, f] of [["left", 0.46], ["right", 0.54]]) {
      await freeze(page, Math.round(f * SEQ));
      const gl = await page.evaluate(geometry);
      const okLook = gl.eyes.every((e) => e.x >= vx - vw / 2 + inset - 0.5 && e.x + e.w <= vx + vw / 2 - inset + 0.5);
      check(`[${w}px] both eyes stay inside the visor while looking ${label}`, okLook, `gaze shift ${gl.gaze.toFixed(1)} units`);
    }
    await freeze(page, Math.round((150 / 1200) * SEQ));
    await page.evaluate(({ vx, vy, vw, vh }) => {
      const d = document.createElement("div");
      d.style.cssText = `position:fixed;left:${vx - vw / 2}px;top:${vy - vh / 2}px;width:${vw}px;height:${vh}px;border:1px dashed red;border-radius:${0.45 * vh}px;z-index:2147483647;pointer-events:none`;
      document.body.appendChild(d);
    }, { vx, vy, vw, vh });
    await page.screenshot({ path: `shots/preloader/align-${w}.png`, clip: { x: Math.max(0, g.head.x - 12), y: Math.max(0, g.head.y - 12), width: g.head.w + 24, height: g.head.h + 24 } });
    await ctx.close();
  }
}

// ---------------------------------------------------------------- timing
// The fade is an opacity animation that runs off the main thread, so frame sampling during heavy page work is late.
// This measures on the animation clock instead: first displayed sample to the end of the fade (start + its duration).
const fadeClock = (pl) => {
  const first = pl.find((x) => x.display !== "none" && x.opacity > 0.01);
  const fade = [...pl].reverse().find((x) => x.rootAnim && /preloader-(out|leave)/.test(x.rootAnim.name)); // the fade that actually finished
  if (!first || !fade) return null;
  const end = fade.rootAnim.start + fade.rootAnim.endTime; // start + its delay + its duration
  return { shownAt: first.tl, fadeName: fade.rootAnim.name, fadeEnd: end, shownFor: end - first.tl };
};
const visibleSpan = (pl) => {
  const start = pl.find((x) => x.display !== "none" && x.opacity > 0.01);
  if (!start) return null;
  const end = pl.find((x) => x.t > start.t && (x.display === "none" || x.opacity <= 0.01));
  return { start: start.t, end: end ? end.t : null };
};
const overlayGone = () => {
  const p = window.__pl;
  const s = p.find((x) => x.display !== "none" && x.opacity > 0.01);
  return !!s && p.some((x) => x.t > s.t && (x.display === "none" || x.opacity <= 0.01));
};

if (want("timing")) {
  // (a) throttled network. Chrome's network emulation also changes what navigator.connection reports, so a really slow
  // network is (correctly) skipped by the slow-connection rule. Two cases: (a1) as reported, (a2) reported as 4g so the
  // overlay shows while the page is still loading, to prove the overlay leaves on its own whatever the loading state.
  const throttled = async (reportAs) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 500, downloadThroughput: 60 * 1024, uploadThroughput: 60 * 1024 });
    await page.addInitScript(SAMPLER);
    if (reportAs) await page.addInitScript((c) => { Object.defineProperty(navigator, "connection", { value: c, configurable: true }); }, reportAs);
    await page.goto(base + "/", { waitUntil: "commit", timeout: 60000 });
    return { ctx, page };
  };
  {
    const { ctx, page } = await throttled(null);
    await page.waitForFunction(() => document.readyState !== "loading", null, { timeout: 60000 });
    await page.waitForTimeout(2500);
    const r = await page.evaluate(() => ({ type: navigator.connection ? navigator.connection.effectiveType : "n/a", n: window.__pl.filter((x) => x.display !== "none" && x.opacity > 0.01).length, state: document.documentElement.getAttribute("data-preloader") }));
    const slow = /^(slow-2g|2g|3g)$/.test(r.type);
    check("[throttled network, as the browser reports it] a connection reported as slow skips the preloader; otherwise it shows", slow ? r.n === 0 && r.state === null : r.n > 0, JSON.stringify(r));
    await ctx.close();
  }
  {
    const { ctx, page } = await throttled({ effectiveType: "4g", saveData: false });
    await page.waitForFunction(() => window.__pl && window.__pl.some((x) => x.display !== "none" && x.opacity > 0.01), null, { timeout: 60000 });
    await page.waitForFunction(overlayGone, null, { timeout: 60000 });
    const r = await page.evaluate(() => ({ pl: window.__pl, loadAt: window.__loadAt ?? null, ready: document.readyState }));
    const clock = fadeClock(r.pl);
    const span = visibleSpan(r.pl);
    const note = r.loadAt === null ? "page had not finished loading" : "page loaded " + (r.loadAt - span.start) + " ms after the overlay appeared";
    check("[throttled network, reported as 4g] overlay is on screen for about 6 s and no more than 6.5 s, on the animation clock", !!clock && clock.shownFor >= 5900 && clock.shownFor <= 6500, `${clock ? Math.round(clock.shownFor) : "?"} ms via ${clock ? clock.fadeName : "?"}; ${note}`);
    await ctx.close();
  }

  // (b) fast local load: gone within 400 ms of the load event; (c) layout shift; (d) LCP element
  {
    const { ctx, page } = await open("/", { width: 390, height: 844 });
    await page.waitForFunction(overlayGone, null, { timeout: 20000 });
    await page.waitForTimeout(1500);
    const r = await page.evaluate(() => ({ pl: window.__pl, loadAt: window.__loadAt, loadAbs: window.__loadAbs, cls: window.__cls, lcp: window.__lcp, state: document.documentElement.getAttribute("data-preloader") }));
    const clock = fadeClock(r.pl);
    const afterLoad = clock ? clock.fadeEnd - r.loadAbs : null;
    check("[fast load] the page had loaded early, yet the overlay stays at least 6 s (6 to 6.5 s on the animation clock)", !!clock && r.loadAt < 3000 && clock.shownFor >= 5900 && clock.shownFor <= 6500, `page loaded at ${r.loadAt} ms; on screen ${clock ? Math.round(clock.shownFor) : "?"} ms; fade ${clock ? clock.fadeName : "?"}`);
    check("[fast load] ends in the hidden state afterwards (data-preloader=done)", r.state === "done", String(r.state));
    check("[fast load] layout shift during the whole load and fade-out is 0", r.cls < 0.001, `CLS ${r.cls}`);
    check("[fast load] the page's LCP element is not the head image", !!r.lcp && !(r.lcp.tag === "IMG" && /robot-head/.test(r.lcp.src)), JSON.stringify(r.lcp));
    await ctx.close();
  }

  // (e) hero paint with and without the overlay (control: the same page with the preloader script removed)
  {
    const runs = 5;
    const strip = /<script>\(function[^<]*data-preloader[^<]*<\/script>/;
    const collect = async (withOverlay) => {
      const out = [];
      for (let i = 0; i < runs; i++) {
        const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
        const page = await ctx.newPage();
        if (!withOverlay) {
          await page.route(base + "/", async (route) => {
            const res = await route.fetch();
            const body = (await res.text()).replace(strip, "");
            await route.fulfill({ response: res, body, headers: { ...res.headers(), "content-length": String(Buffer.byteLength(body)) } });
          });
        }
        await page.addInitScript(SAMPLER);
        await page.goto(base + "/", { waitUntil: "load" });
        await page.waitForTimeout(2500);
        out.push(await page.evaluate(() => ({ lcp: window.__lcp, fcp: (performance.getEntriesByName("first-contentful-paint")[0] || {}).startTime || null, overlay: document.documentElement.getAttribute("data-preloader") })));
        await ctx.close();
      }
      return out;
    };
    const med = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
    const withO = await collect(true);
    const without = await collect(false);
    check("[hero paint] the control really has no overlay and the other run does", without.every((x) => x.overlay === null) && withO.every((x) => x.overlay === "run" || x.overlay === "done"), JSON.stringify({ control: without.map((x) => x.overlay), with: withO.map((x) => x.overlay) }));
    const lw = med(withO.map((x) => x.lcp.t)), lo = med(without.map((x) => x.lcp.t));
    const fw = med(withO.map((x) => x.fcp)), fo = med(without.map((x) => x.fcp));
    check("[hero paint] median LCP (the hero text) with the overlay is no later than without it, within 150 ms", lw <= lo + 150, `with ${lw} ms, without ${lo} ms (${runs} runs each); LCP element ${withO[0].lcp.tag} "${withO[0].lcp.text}"`);
    check("[hero paint] median first contentful paint with the overlay is no later than without it, within 150 ms", fw <= fo + 150, `with ${Math.round(fw)} ms, without ${Math.round(fo)} ms`);
  }

  // click-through: the overlay must not block the page underneath
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.addInitScript(SAMPLER);
    await page.goto(base + "/", { waitUntil: "domcontentloaded" });
    const during = await page.evaluate(() => {
      const link = [...document.querySelectorAll("header a")].find((a) => a.textContent.trim() === "Programs");
      const r = link.getBoundingClientRect();
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return { state: document.documentElement.getAttribute("data-preloader"), hit: top ? (top.closest("#preloader") ? "overlay" : top.tagName) : null };
    });
    check("[click-through] while the overlay is showing, a click on the header link reaches the link, not the overlay", (during.state === "run" || during.state === "leave") && during.hit !== "overlay" && during.hit !== null, JSON.stringify(during));
    await Promise.all([page.waitForURL("**/programs", { timeout: 10000 }), page.locator("header a", { hasText: "Programs" }).first().click()]);
    check("[click-through] the link works while the overlay is showing", /\/programs$/.test(page.url()), page.url());
    await ctx.close();
  }
}

// ---------------------------------------------------------------- preview (review-only mode)
if (want("preview")) {
  const { ctx, page, logs } = await open("/?preloader-preview", { width: 390, height: 844 });
  const gather = () => page.evaluate(() => {
    const el = document.getElementById("preloader");
    const cs = el ? getComputedStyle(el) : null;
    const op = (sel) => [...document.querySelectorAll(sel)].map((e) => parseFloat(getComputedStyle(e).opacity));
    return { state: document.documentElement.getAttribute("data-preloader"), seq: document.documentElement.style.getPropertyValue("--pl-seq"), display: cs ? cs.display : "none", opacity: cs ? parseFloat(cs.opacity) : 0, open: op(".pl-eye-open"), happy: op(".pl-eye-happy"), loaded: document.readyState, tl: performance.now() };
  });
  const first = await gather();
  check("[preview] ?preloader-preview sets the sequence to 10 s and shows the overlay", first.seq === "10000ms" && first.state === "run" && first.display === "flex", JSON.stringify({ seq: first.seq, state: first.state, display: first.display }));
  const shownAt = await page.evaluate(() => (window.__pl.find((x) => x.display === "flex") || {}).tl);
  const at = async (ms) => { const now = await page.evaluate(() => performance.now()); const wait = shownAt + ms - now; if (wait > 0) await page.waitForTimeout(wait); return gather(); };
  const t1 = await at(900);
  check("[preview] at 0.9 s the page has long since loaded, yet the overlay is still showing with eyes open", t1.loaded === "complete" && t1.display === "flex" && t1.open.every((o) => o > 0.99), JSON.stringify({ loaded: t1.loaded, state: t1.state, open: t1.open }));
  const t2 = await at(2400);
  check("[preview] at 2.4 s (24% of the 10 s sequence) the eyes are happy (the happy step runs about 1.5 to 2.9 s)", t2.happy.every((o) => o > 0.99) && t2.open.every((o) => o < 0.01), JSON.stringify({ happy: t2.happy, open: t2.open }));
  const t3 = await at(9000);
  check("[preview] at 9 s the overlay is still fully showing", t3.display === "flex" && t3.opacity > 0.99, JSON.stringify({ d: t3.display, o: t3.opacity }));
  const t4 = await at(11000);
  check("[preview] by 11 s it has faded out and is hidden", t4.display === "none" || t4.opacity === 0, JSON.stringify({ state: t4.state, d: t4.display, o: t4.opacity }));
  const pl = await page.evaluate(() => window.__pl);
  const clock = fadeClock(pl);
  check("[preview] the overlay was on screen for at least 10 s on the animation clock", !!clock && clock.shownFor >= 10000, clock ? `${Math.round(clock.shownFor)} ms` : "no fade seen");
  check("[preview] no console errors or warnings", logs.length === 0, logs.join(" | ").slice(0, 200));
  await ctx.close();

  // preview with reduced motion switched on: still shown, with its real durations (globals.css shortens all animations then)
  {
    const r = await open("/?preloader-preview", { width: 390, height: 844, ctxOptions: { reducedMotion: "reduce" } });
    await r.page.waitForTimeout(500);
    const v = await r.page.evaluate(() => ({ shown: getComputedStyle(document.getElementById("preloader")).display !== "none", eye: getComputedStyle(document.querySelector(".pl-eye-open")).animationDuration, root: getComputedStyle(document.getElementById("preloader")).animationDuration }));
    check("[preview] with reduced motion on, the preview is still shown with its real durations (10 s sequence, 0.3 s fade)", v.shown && v.eye === "10s" && v.root === "0.3s", JSON.stringify(v));
    await r.ctx.close();
    const n = await open("/", { width: 390, height: 844, ctxOptions: { reducedMotion: "reduce" } });
    const hidden = await n.page.evaluate(() => getComputedStyle(document.getElementById("preloader")).display === "none");
    check("[preview] without the parameter, reduced motion still hides the preloader", hidden);
    await n.ctx.close();
  }

  // a custom length, and the normal URL is unaffected
  const c = await open("/?preloader-preview=3", { width: 390, height: 844 });
  const s3 = await c.page.evaluate(() => document.documentElement.style.getPropertyValue("--pl-seq"));
  check("[preview] ?preloader-preview=3 sets 3 s", s3 === "3000ms", s3);
  await c.ctx.close();
  const n = await open("/", { width: 390, height: 844 });
  const sn = await n.page.evaluate(() => ({ inline: document.documentElement.style.getPropertyValue("--pl-seq"), computed: getComputedStyle(document.documentElement).getPropertyValue("--pl-seq").trim() }));
  check("[preview] a normal URL keeps the 6 s sequence", sn.inline === "" && (sn.computed === "6000ms" || sn.computed === "6s"), JSON.stringify(sn));
  await n.ctx.close();
}

// ---------------------------------------------------------------- skip
// In every skip case the overlay must never be drawn, not even for one frame. The sampler records the overlay's
// display and opacity on every animation frame from the first frame, so a one-frame flash would show up.
const everVisible = (pl) => pl.filter((x) => x.display !== "none" && x.opacity > 0.01).length;

if (want("skip")) {
  const settle = 700; // after load, long enough to catch a late flash

  // helper: open a page with extra init script / context options, wait for load, report whether it was ever drawn
  async function visit(label, { path = "/", ctxOptions = {}, init, expectVisible = false, viaPage }) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, ...ctxOptions });
    const page = viaPage ? await viaPage(ctx) : await ctx.newPage();
    const logs = [];
    page.on("console", (m) => { if (["error", "warning"].includes(m.type())) logs.push(m.text()); });
    page.on("pageerror", (e) => logs.push(e.message));
    await page.addInitScript(SAMPLER);
    if (init) await page.addInitScript(init.fn ?? init, init.arg); // an init script is serialised, so arguments are passed, not captured
    await page.goto(base + path, { waitUntil: "load" });
    await page.waitForTimeout(settle);
    const r = await page.evaluate(() => ({ frames: window.__pl.length, pl: window.__pl, state: document.documentElement.getAttribute("data-preloader"), el: !!document.getElementById("preloader") }));
    const n = everVisible(r.pl);
    if (expectVisible) check(`[skip] ${label}: the preloader IS shown`, n > 0 && r.state !== null, `${n} visible frames of ${r.frames}, state ${r.state}`);
    else check(`[skip] ${label}: never drawn, not even one frame`, n === 0 && r.frames >= 1, `${n} visible frames of ${r.frames} sampled, state ${r.state}`);
    check(`[skip] ${label}: no console errors or warnings`, logs.length === 0, logs.join(" | ").slice(0, 160));
    return { ctx, page, r };
  }

  // 0. Control: a first visit with nothing special shows it, and writes the flag
  {
    const v = await visit("first visit, nothing special", { expectVisible: true });
    const flag = await v.page.evaluate(() => sessionStorage.getItem("tareeq:preloader-seen"));
    check("[skip] no session flag is written: the preloader shows on every load", flag === null, String(flag));

    // 1. Same session: a reload, then a full navigation to another page in the same tab, both skip it
    await v.page.reload({ waitUntil: "load" });
    await v.page.waitForTimeout(settle);
    const reloaded = await v.page.evaluate(() => ({ shown: getComputedStyle(document.getElementById("preloader")).display !== "none", state: document.documentElement.getAttribute("data-preloader") }));
    check("[skip] a reload shows the preloader again (every load and refresh)", reloaded.shown && reloaded.state === "run", JSON.stringify(reloaded));
    await v.page.goto(base + "/about", { waitUntil: "load" });
    await v.page.waitForTimeout(settle);
    const other = await v.page.evaluate(() => ({ shown: getComputedStyle(document.getElementById("preloader")).display !== "none", state: document.documentElement.getAttribute("data-preloader") }));
    check("[skip] another page loaded in the same tab shows it too", other.shown && other.state === "run", JSON.stringify(other));
    await v.ctx.close();

    // A new tab/context is a new session: it shows again
    await visit("a new browser session", { expectVisible: true }).then((x) => x.ctx.close());
  }

  // 2. Reduced motion
  await visit("reduced motion", { ctxOptions: { reducedMotion: "reduce" } }).then((x) => x.ctx.close());

  // 3. Data saver and slow connections (Network Information API injected before the page runs)
  const net = (conn) => ({ fn: (c) => { Object.defineProperty(navigator, "connection", { value: c, configurable: true }); }, arg: conn });
  await visit("data saver on", { init: net({ saveData: true, effectiveType: "4g" }) }).then((x) => x.ctx.close());
  await visit("connection reported as slow-2g", { init: net({ saveData: false, effectiveType: "slow-2g" }) }).then((x) => x.ctx.close());
  await visit("connection reported as 2g", { init: net({ saveData: false, effectiveType: "2g" }) }).then((x) => x.ctx.close());
  await visit("connection reported as 3g", { init: net({ saveData: false, effectiveType: "3g" }) }).then((x) => x.ctx.close());
  await visit("connection reported as 4g (not slow)", { init: net({ saveData: false, effectiveType: "4g" }), expectVisible: true }).then((x) => x.ctx.close());
  await visit("browser does not report the connection at all", { init: () => { Object.defineProperty(navigator, "connection", { value: undefined, configurable: true }); }, expectVisible: true }).then((x) => x.ctx.close());

  // 4. Storage blocked: it must be skipped (so it cannot replay on every page)
  await visit("session storage blocked (no longer needed, so it still shows)", { expectVisible: true, init: () => { Object.defineProperty(window, "sessionStorage", { get() { throw new DOMException("blocked", "SecurityError"); }, configurable: true }); } }).then((x) => x.ctx.close());

  // 5. A first visit that lands on a deep link shows it too
  await visit("first visit on a deep link (/about)", { path: "/about", expectVisible: true }).then((x) => x.ctx.close());

  // 6. Scripting disabled: the page must be fully visible with no white cover
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto(base + "/", { waitUntil: "load" });
    await page.waitForTimeout(500);
    const r = await page.evaluate(() => { const el = document.getElementById("preloader"); return { display: getComputedStyle(el).display, state: document.documentElement.getAttribute("data-preloader") }; }).catch((e) => ({ error: String(e) }));
    check("[skip] scripting disabled: the overlay is hidden and the page is visible", r.display === "none" && r.state === null, JSON.stringify(r));
    await ctx.close();
  }

  // 7. Preview mode bypasses the skip rules (it is for reviewing), without writing the session flag
  {
    const v = await visit("review preview (?preloader-preview) after the session already saw it", { path: "/?preloader-preview=3", expectVisible: true, viaPage: async (ctx) => { const p = await ctx.newPage(); await p.addInitScript(() => { try { sessionStorage.setItem("tareeq:preloader-seen", "1"); } catch (e) { /* ignore */ } }); return p; } });
    await v.ctx.close();
  }
}

// ---------------------------------------------------------------- a11y
const FOCUSABLE = 'a[href], button, input, select, textarea, summary, [tabindex], [contenteditable=""], [contenteditable="true"], iframe, audio[controls], video[controls]';

if (want("a11y")) {
  const tabOrder = async (page, n) => {
    const seen = [];
    await page.evaluate(() => document.activeElement && document.activeElement.blur());
    for (let i = 0; i < n; i++) {
      await page.keyboard.press("Tab");
      seen.push(await page.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return "(body)"; return (e.getAttribute("aria-label") || e.textContent || e.tagName).trim().slice(0, 40); }));
    }
    return seen;
  };

  // A first visit: the overlay is showing
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.addInitScript(SAMPLER);
  await page.goto(base + "/", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.documentElement.getAttribute("data-preloader") === "run");

  const dom = await page.evaluate((sel) => {
    const el = document.getElementById("preloader");
    const cs = getComputedStyle(el);
    const focusables = [...el.querySelectorAll(sel)].map((e) => e.tagName);
    const main = document.querySelector("main");
    return {
      ariaHidden: el.getAttribute("aria-hidden"),
      role: el.getAttribute("role"),
      focusables,
      pointerEvents: cs.pointerEvents,
      visible: cs.display !== "none",
      mainHidden: !!(main && main.closest('[aria-hidden="true"]')),
      imgAlt: [...el.querySelectorAll("img")].map((i) => i.getAttribute("alt")),
      svgHidden: [...el.querySelectorAll("svg")].every((s) => s.getAttribute("aria-hidden") === "true" && s.getAttribute("focusable") === "false"),
      text: el.textContent.trim(),
    };
  }, FOCUSABLE);
  check("[a11y] the overlay is showing while it is checked", dom.visible);
  check("[a11y] the overlay is aria-hidden and has no role", dom.ariaHidden === "true" && dom.role === null, JSON.stringify({ ariaHidden: dom.ariaHidden, role: dom.role }));
  check("[a11y] the overlay contains nothing focusable", dom.focusables.length === 0, dom.focusables.join(","));
  check("[a11y] the overlay does not capture the pointer", dom.pointerEvents === "none");
  check("[a11y] the head image is decorative (empty alt) and every SVG is hidden and not focusable", dom.imgAlt.every((a) => a === "") && dom.svgHidden, JSON.stringify(dom.imgAlt));
  check("[a11y] the overlay has no text for assistive technology", dom.text === "", JSON.stringify(dom.text));
  check("[a11y] the page content (main) is not hidden from assistive technology by the overlay", !dom.mainHidden);

  // The accessibility tree must be identical with the overlay showing and after it has gone
  // Snapshot after hydration (Next adds its own empty route-announcer region then) and with nothing focused,
  // so the comparison isolates the overlay. The overlay is still showing: it stays 6 s.
  await page.waitForLoadState("load");
  await page.waitForTimeout(1200);
  const stillShowing = await page.evaluate(() => document.documentElement.getAttribute("data-preloader") === "run");
  check("[a11y] the accessibility snapshot is taken while the overlay is still showing", stillShowing);
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  const treeDuring = await page.locator("body").ariaSnapshot();
  const order1 = await tabOrder(page, 8);
  check("[a11y] Tab from the very first key press reaches the skip link first", order1[0] === "Skip to content", order1.join(" > "));

  // Focus is not moved by the overlay leaving
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  for (let i = 0; i < 3; i++) await page.keyboard.press("Tab");
  const before = await page.evaluate(() => (document.activeElement.getAttribute("aria-label") || document.activeElement.textContent || "").trim());
  await page.waitForFunction(() => document.documentElement.getAttribute("data-preloader") === "done", null, { timeout: 15000 });
  const after = await page.evaluate(() => (document.activeElement.getAttribute("aria-label") || document.activeElement.textContent || "").trim());
  check("[a11y] keyboard focus is exactly where it was after the overlay leaves", before !== "" && before === after, `${before} -> ${after}`);

  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  const treeAfter = await page.locator("body").ariaSnapshot();
  check("[a11y] the accessibility tree is identical with the overlay showing and after it has gone", treeDuring === treeAfter, treeDuring === treeAfter ? `${treeDuring.length} chars` : "trees differ");

  // No keyboard trap: Tab keeps moving through the whole page (header, hero, footer) and eventually leaves it
  const walk = await tabOrder(page, 40);
  const distinct = new Set(walk.filter((x) => x !== "(body)"));
  check("[a11y] Tab moves through the whole page without getting stuck (at least 10 different stops)", distinct.size >= 10, `${distinct.size} distinct stops; ${walk.slice(0, 6).join(" > ")} ...`);
  check("[a11y] Tab reaches the footer links", [...distinct].some((x) => /Programs|Courses|About|Contact/.test(x)) && walk.some((x) => /Chat with Tareeq/.test(x)), walk.slice(-6).join(" > "));
  await ctx.close();

  // The same page in a second session where the overlay is skipped: the Tab order must be identical
  const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const p2 = await ctx2.newPage();
  await p2.goto(base + "/", { waitUntil: "load" });
  const order2 = await tabOrder(p2, 8);
  check("[a11y] the Tab order is the same with the overlay and without it (first 8 stops)", JSON.stringify(order1) === JSON.stringify(order2), `with: ${order1.join(" > ")} | without: ${order2.join(" > ")}`);
  await ctx2.close();
}

await browser.close();
console.log(results.join("\n"));
process.exit(results.some((r) => r.startsWith("FAIL")) ? 1 : 0);
