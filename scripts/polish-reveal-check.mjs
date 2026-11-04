// Feature 004 checks: scroll reveal, interaction polish, no-motion fallbacks, stability.
// Usage: CHROME=<path> BASE=http://localhost:3100 node scripts/polish-reveal-check.mjs [only]   (only: reduced | nojs | home | nav | ...)
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const base = process.env.BASE ?? "http://localhost:3100";
const only = process.argv[2];
mkdirSync("shots/004", { recursive: true });
const b = await chromium.launch({ executablePath: process.env.CHROME });
const results = [];
const check = (name, ok, extra = "") => results.push(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  (" + extra + ")" : ""}`);
const want = (name) => !only || only === name;
const PAGES = ["/", "/our-way", "/programs", "/contact"];

const CLS_INIT = () => {
  window.__cls = 0;
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
  }).observe({ type: "layout-shift", buffered: true });
};

const waitPreloader = async (p) => {
  await p.waitForFunction(() => document.documentElement.getAttribute("data-preloader") !== "run", null, { timeout: 20000 });
  await p.waitForTimeout(1300); // the reveals that were waiting start as it leaves
};
const reveals = (p) =>
  p.evaluate(() =>
    [...document.querySelectorAll("[data-reveal]")].map((el, i) => {
      const r = el.getBoundingClientRect();
      return { i, revealed: el.hasAttribute("data-revealed"), o: Number(getComputedStyle(el).opacity), top: r.top, bottom: r.bottom, h: innerHeight };
    }),
  );
const scrollTo = (p, y) => p.evaluate((v) => window.scrollTo({ top: v, behavior: "instant" }), y);

// ---------- A. reduced motion: everything visible, nothing armed ----------
if (want("reduced")) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const p = await ctx.newPage();
  for (const href of PAGES) {
    await p.goto(base + href, { waitUntil: "load" });
    await p.waitForTimeout(800);
    const s = await reveals(p);
    const armed = await p.evaluate(() => document.documentElement.hasAttribute("data-reveal-ready"));
    const moving = await p.evaluate(() => document.getAnimations().filter((a) => /page-enter|cue-bob|hiw-glow/.test(a.animationName ?? "") && a.playState === "running" && a.effect?.getTiming().duration > 1).length);
    check(`[reduced motion] ${href}: ${s.length} reveal blocks all at opacity 1, hiding not armed`, s.every((x) => x.o === 1) && !armed, `armed=${armed}`);
    check(`[reduced motion] ${href}: no looping or entrance animation running`, moving === 0, String(moving));
  }
  await ctx.close();
}

// ---------- B. JavaScript off ----------
if (want("nojs")) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  const p = await ctx.newPage();
  for (const href of PAGES) {
    await p.goto(base + href, { waitUntil: "load" });
    const s = await reveals(p);
    check(`[no JS] ${href}: ${s.length} reveal blocks all at opacity 1`, s.every((x) => x.o === 1));
  }
  await ctx.close();
}

// ---------- C. home page reveals at 1440 and 390 ----------
if (want("home")) {
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const tag = `[${w}px]`;
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    const p = await ctx.newPage();
    await p.addInitScript(CLS_INIT);
    await p.goto(base + "/", { waitUntil: "load" });
    await p.waitForTimeout(500);
    const armed = await p.evaluate(() => document.documentElement.hasAttribute("data-reveal-ready"));
    check(`${tag} / reveal is armed after load`, armed);
    await waitPreloader(p);
    const first = await reveals(p);
    check(`${tag} / has reveal blocks`, first.length >= 12, String(first.length));
    const below = first.filter((x) => x.top > x.h * 1.05);
    check(`${tag} / blocks well below the fold are hidden until reached`, below.length > 0 && below.every((x) => !x.revealed && x.o === 0), `${below.length} below`);
    const inView = first.filter((x) => x.bottom > 0 && x.top < x.h * 0.9);
    check(`${tag} / blocks in view when the preloader leaves are shown`, inView.every((x) => x.o > 0.99), `${inView.length} in view`);
    await p.screenshot({ path: `shots/004/home-reveal-${w}-0-top.png` });

    // scroll down in steps; capture mid-reveal and settled
    const total = await p.evaluate(() => document.documentElement.scrollHeight);
    let shot = 0;
    for (let y = 0; y < total; y += Math.round(h * 0.6)) {
      await scrollTo(p, y);
      await p.waitForTimeout(250);
      if (shot < 3 && y > 0) await p.screenshot({ path: `shots/004/home-reveal-${w}-${++shot}-mid.png` });
      await p.waitForTimeout(900);
    }
    await scrollTo(p, total);
    await p.waitForTimeout(1200);
    const end = await reveals(p);
    check(`${tag} / after scrolling through, every block is revealed and fully visible`, end.every((x) => x.revealed && x.o > 0.99), `${end.filter((x) => !(x.revealed && x.o > 0.99)).length} not`);
    await scrollTo(p, 0);
    await p.waitForTimeout(800);
    const back = await reveals(p);
    check(`${tag} / scrolling back up leaves everything visible (no replay, no hiding)`, back.every((x) => x.o > 0.99));
    const cls = await p.evaluate(() => window.__cls);
    check(`${tag} / layout shift through the whole scroll at or below 0.05`, cls <= 0.05, cls.toFixed(4));

    // stagger: cards in the Who it's for grid reveal in order
    const p2 = await ctx.newPage();
    await p2.goto(base + "/", { waitUntil: "load" });
    await waitPreloader(p2);
    const order = await p2.evaluate(async () => {
      const cards = [...document.querySelectorAll('section[aria-labelledby="programs-title"] ul > [data-reveal]')];
      cards[0].scrollIntoView({ block: "center", behavior: "instant" });
      const t0 = performance.now();
      const times = cards.map(() => null);
      while (performance.now() - t0 < 2500) {
        await new Promise((r) => requestAnimationFrame(r));
        cards.forEach((c, i) => { if (times[i] === null && Number(getComputedStyle(c).opacity) > 0.5) times[i] = performance.now() - t0; });
      }
      return times;
    });
    // single column on a phone: cards below the screen wait to be scrolled to, so only the ones in view are compared
    const seen = order.filter((t) => t !== null);
    check(`${tag} / program cards reveal in order, one after another`, seen.length >= (w >= 768 ? 3 : 2) && seen.every((t, i) => i === 0 || t >= seen[i - 1] - 1), order.map((t) => t?.toFixed(0) ?? "-").join(", "));
    await p2.close();
    await ctx.close();
  }
}

// ---------- D. client-side navigation: nothing in view flashes hidden ----------
if (want("nav")) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(base + "/", { waitUntil: "load" });
  await waitPreloader(p);
  await p.evaluate(() => {
    window.__min = 1;
    const tick = () => {
      document.querySelectorAll("[data-reveal]").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.bottom > 0 && r.top < innerHeight * 0.85) window.__min = Math.min(window.__min, Number(getComputedStyle(el).opacity));
      });
      requestAnimationFrame(tick);
    };
    tick();
  });
  for (const label of ["Programs", "Our Way", "Contact"]) {
    await p.getByRole("navigation", { name: "Main" }).getByRole("link", { name: label }).click();
    await p.waitForTimeout(1500);
  }
  const min = await p.evaluate(() => window.__min);
  check("[nav] after client-side navigation, blocks in view never flash hidden (lowest opacity seen)", min > 0.99, String(min));
  // new page reveals still work
  await p.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Programs" }).click();
  await p.waitForTimeout(1200);
  const s = await reveals(p);
  const below = s.filter((x) => x.top > x.h * 1.05);
  check("[nav] reveal is armed again on the new page (blocks below the fold are hidden)", below.length === 0 || below.every((x) => x.o === 0 || x.revealed));
  await ctx.close();
}

// ---------- E. interaction: lift, press, underline, keyboard focus, touch targets ----------
if (want("interaction")) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  const matrix = (sel, pseudo) =>
    p.evaluate(([s, ps]) => {
      const el = document.querySelector(s);
      const m = new DOMMatrixReadOnly(getComputedStyle(el, ps || null).transform);
      return { a: m.a, f: m.f, shadow: getComputedStyle(el).boxShadow };
    }, [sel, pseudo]);

  for (const [href, sel] of [["/", 'section[aria-labelledby="who-title"] .lift'], ["/programs", "main article.lift"]]) {
    await p.goto(base + href, { waitUntil: "load" });
    await waitPreloader(p);
    await p.locator(sel).first().scrollIntoViewIfNeeded();
    await p.waitForTimeout(1400);
    const rest = await matrix(sel);
    const box = await p.locator(sel).first().boundingBox();
    await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 4 });
    await p.waitForTimeout(500);
    const hov = await matrix(sel);
    check(`[interaction] ${href}: a card lifts 2 to 6px on hover and its shadow deepens`, hov.f <= -2 && hov.f >= -6 && hov.shadow !== rest.shadow, `lift ${hov.f.toFixed(1)}px`);
    await p.screenshot({ path: `shots/004/hover-${href === "/" ? "home" : "programs"}-1440.png` });
    await p.mouse.move(5, 5);
    await p.waitForTimeout(500);
    const back = await matrix(sel);
    check(`[interaction] ${href}: the card returns to rest when the pointer leaves`, Math.abs(back.f) < 0.5);
  }

  // keyboard focus lifts the card that holds the focused link
  await p.goto(base + "/programs", { waitUntil: "load" });
  await waitPreloader(p);
  await p.evaluate(() => document.querySelector("main article.lift a")?.focus({ focusVisible: true }));
  await p.waitForTimeout(500);
  const focusLift = await p.evaluate(() => {
    const art = document.activeElement?.closest("article.lift");
    return art ? new DOMMatrixReadOnly(getComputedStyle(art).transform).f : null;
  });
  check("[interaction] /programs: keyboard focus inside a card lifts it", focusLift !== null && focusLift <= -2, String(focusLift));

  // button press feedback
  const btn = p.locator("main article a:has-text('Join this workshop')").first();
  await btn.scrollIntoViewIfNeeded();
  await p.waitForTimeout(500);
  const bb = await btn.boundingBox();
  await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2, { steps: 3 });
  await p.mouse.down();
  await p.waitForTimeout(300);
  // Tailwind v4 animates the individual `scale` property, not `transform`
  const scaleOf = (v) => (v === "none" || !v ? 1 : parseFloat(v.split(" ")[0]) / (v.split(" ")[0].endsWith("%") ? 100 : 1));
  const pressed = await btn.evaluate((el) => getComputedStyle(el).scale).then(scaleOf);
  await p.mouse.move(5, 5);
  await p.mouse.up();
  check("[interaction] a pressed button scales to about 0.98", pressed > 0.96 && pressed < 0.995, pressed.toFixed(3));

  // nav underline draws in on hover and stays for the current page
  await p.goto(base + "/our-way", { waitUntil: "load" });
  await waitPreloader(p);
  const navScale = (name) =>
    p.getByRole("navigation", { name: "Main" }).getByRole("link", { name }).evaluate((el) => getComputedStyle(el, "::after").scale).then(scaleOf);
  check("[interaction] the current nav link shows its underline (scaleX 1)", (await navScale("Our Way")) > 0.99);
  check("[interaction] another nav link shows no underline at rest (scaleX 0)", (await navScale("Contact")) < 0.01);
  await p.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Contact" }).hover();
  await p.waitForTimeout(400);
  check("[interaction] hovering a nav link draws its underline in", (await navScale("Contact")) > 0.99);

  // keyboard: focus ring visible, targets at least 44px high
  await p.goto(base + "/programs", { waitUntil: "load" });
  await waitPreloader(p);
  await scrollTo(p, 0);
  const seen = [];
  for (let i = 0; i < 14; i++) {
    await p.keyboard.press("Tab");
    seen.push(await p.evaluate(() => {
      const el = document.activeElement;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return { tag: el.tagName, text: (el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 24), ow: parseFloat(cs.outlineWidth), os: cs.outlineStyle, h: r.height };
    }));
  }
  const noRing = seen.filter((x) => !(x.ow >= 2 && x.os !== "none"));
  check("[interaction] every element reached by Tab shows a focus outline of at least 2px", noRing.length === 0, noRing.map((x) => x.text).join(" | "));
  const small = await p.evaluate(() =>
    [...document.querySelectorAll("header nav a, main a, main button, footer a")].filter((el) => !el.closest("[data-hero-card]") && el.offsetParent !== null && !el.classList.contains("sr-only")).filter((el) => el.getBoundingClientRect().height < 43.5).map((el) => (el.textContent || "").trim().slice(0, 24)),
  );
  check("[interaction] every link and button in the nav, page and footer is at least 44px high", small.length === 0, small.join(" | "));
  await ctx.close();

  // touch device: targets still 44px
  const tctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const tp = await tctx.newPage();
  await tp.goto(base + "/programs", { waitUntil: "load" });
  await waitPreloader(tp);
  const touchSmall = await tp.evaluate(() =>
    [...document.querySelectorAll("header a, header button, main a, main button, footer a")].filter((el) => !el.closest("[data-hero-card]") && el.offsetParent !== null && !el.classList.contains("sr-only")).filter((el) => { const r = el.getBoundingClientRect(); return r.height < 43.5 || r.width < 43.5; }).map((el) => (el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 24)),
  );
  check("[interaction] 390 touch: every tap target is at least 44x44px", touchSmall.length === 0, touchSmall.join(" | "));
  await tctx.close();
}

// ---------- F. stability: no-motion modes, jumps, focus, resize, widths, CPU ----------
if (want("stability")) {
  const names = { "/": "home", "/our-way": "our-way", "/programs": "programs", "/contact": "contact" };

  // F1. reduced motion and no JavaScript, both widths: complete, still, screenshots
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    for (const mode of ["reduced", "nojs"]) {
      const ctx = await b.newContext({ viewport: { width: w, height: h }, ...(mode === "reduced" ? { reducedMotion: "reduce" } : { javaScriptEnabled: false }) });
      const p = await ctx.newPage();
      for (const href of PAGES) {
        await p.goto(base + href, { waitUntil: "load" });
        await p.waitForTimeout(700);
        const s = await reveals(p);
        // reduced motion: nothing may run. No JavaScript: motion is allowed, so the CSS-only entrance and the scroll cue may run; only content visibility is required
        const running = mode === "reduced" ? await p.evaluate(() =>
          document.getAnimations().filter((a) => a.playState === "running" && a.effect?.target?.closest?.("[data-reveal], .lift, .cue, .page-enter, .page-enter-h1")).length,
        ) : 0;
        await p.waitForTimeout(mode === "nojs" ? 900 : 0);
        const settled = await reveals(p);
        check(`[${mode} ${w}] ${href}: all content visible and ${mode === "reduced" ? "nothing animating" : "(CSS-only motion allowed)"}`, settled.every((x) => x.o === 1) && running === 0, `running ${running}`);
        await p.screenshot({ path: `shots/004/${names[href]}-${mode}-${w}.png`, fullPage: true });
      }
      await ctx.close();
    }
  }

  // F2. keyboard End/Home, focus inside an unrevealed block
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage();
    await p.goto(base + "/", { waitUntil: "load" });
    await waitPreloader(p);
    await p.keyboard.press("End");
    await p.waitForTimeout(1600);
    const endState = await reveals(p);
    check("[jumps] End: everything is visible within 1.6 s", endState.filter((x) => x.top < x.h && x.bottom > 0).every((x) => x.o > 0.99), `${endState.filter((x) => x.top < x.h && x.bottom > 0 && x.o <= 0.99).length} still faint`);
    await p.keyboard.press("Home");
    await p.waitForTimeout(1200);
    const target = p.locator('section[aria-labelledby="programs-title"] a[href="/programs"]');
    // put it below the fold and unrevealed in a fresh load, then focus it
    const p2 = await ctx.newPage();
    await p2.goto(base + "/", { waitUntil: "load" });
    await waitPreloader(p2);
    const before = await p2.evaluate(() => {
      const a = document.querySelector('section[aria-labelledby="programs-title"] a[href="/programs"]');
      const w = a.closest("[data-reveal]");
      return { revealed: w.hasAttribute("data-revealed"), o: Number(getComputedStyle(w).opacity) };
    });
    await p2.evaluate(() => document.querySelector('section[aria-labelledby="programs-title"] a[href="/programs"]').focus());
    await p2.waitForTimeout(80);
    const after = await p2.evaluate(() => {
      const a = document.querySelector('section[aria-labelledby="programs-title"] a[href="/programs"]');
      const w = a.closest("[data-reveal]");
      return { revealed: w.hasAttribute("data-revealed"), o: Number(getComputedStyle(w).opacity) };
    });
    check("[focus] a block below the fold starts hidden, and focusing a link inside it reveals it at once", !before.revealed && before.o === 0 && after.revealed && after.o > 0.99, JSON.stringify({ before, after }));
    await p2.close();
    void target;
    await ctx.close();
  }

  // F3. layout shift through a full slow scroll, and no horizontal scroll at six widths, on every page
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    for (const href of PAGES) {
      const p = await ctx.newPage();
      await p.addInitScript(CLS_INIT);
      await p.goto(base + href, { waitUntil: "load" });
      await waitPreloader(p);
      const total = await p.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y <= total; y += Math.round(h * 0.5)) {
        await scrollTo(p, y);
        await p.waitForTimeout(220);
      }
      const cls = await p.evaluate(() => window.__cls);
      check(`[${w}] ${href}: layout shift through a full scroll at or below 0.05`, cls <= 0.05, cls.toFixed(4));
      await p.close();
    }
    await ctx.close();
  }
  for (const w of [360, 390, 768, 1024, 1440, 1920]) {
    const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
    const p = await ctx.newPage();
    const bad = [];
    for (const href of PAGES) {
      await p.goto(base + href, { waitUntil: "load" });
      await waitPreloader(p);
      const total = await p.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y <= total; y += 450) { await scrollTo(p, y); await p.waitForTimeout(120); }
      if (await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)) bad.push(href);
    }
    check(`[${w}] no horizontal scroll on any page after revealing everything`, bad.length === 0, bad.join(","));
    await ctx.close();
  }

  // F4. resize across 1024 mid-scroll, and rotate a phone
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage();
    await p.goto(base + "/", { waitUntil: "load" });
    await waitPreloader(p);
    await scrollTo(p, 1500);
    await p.waitForTimeout(800);
    for (const [w, h] of [[900, 900], [1440, 900], [844, 390], [390, 844]]) {
      await p.setViewportSize({ width: w, height: h });
      await p.waitForTimeout(500);
    }
    const total = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y <= total; y += 380) { await scrollTo(p, y); await p.waitForTimeout(160); }
    await p.waitForTimeout(1200);
    const s = await reveals(p);
    check("[resize] after resizing across 1024 and rotating, scrolling through reveals everything (nothing stuck hidden)", s.every((x) => x.o > 0.99), `${s.filter((x) => x.o <= 0.99).length} faint`);
    check("[resize] no horizontal scroll after resizing", !(await p.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)));
    await ctx.close();
  }

  // F5. long tasks while scrolling with the CPU slowed 4x (mid-range phone stand-in)
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const p = await ctx.newPage();
    await p.goto(base + "/", { waitUntil: "load" });
    await waitPreloader(p);
    const cdp = await ctx.newCDPSession(p);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await p.evaluate(() => {
      window.__lt = [];
      new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__lt.push(Math.round(e.duration)))).observe({ type: "longtask", buffered: false });
    });
    const total = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y <= total; y += 300) { await scrollTo(p, y); await p.waitForTimeout(150); }
    await p.waitForTimeout(800);
    const lt = await p.evaluate(() => window.__lt);
    const sum = lt.reduce((a, c) => a + c, 0);
    console.log(`long tasks at 4x CPU slowdown, 390px home scroll: ${lt.length} tasks, ${sum} ms total, longest ${Math.max(0, ...lt)} ms`);
    check("[cpu] scrolling the home page at 4x CPU slowdown stays free of very long tasks (none over 400 ms)", Math.max(0, ...lt) <= 400, `${lt.length} tasks, longest ${Math.max(0, ...lt)} ms`);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    await ctx.close();
  }
}

// ---------- G. inner pages: headers, story reveals, Urdu feature, contact cards, copy unchanged ----------
if (want("inner")) {
  const INNER = ["/our-way", "/programs", "/contact"];
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const tag = `[${w}px]`;
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    for (const href of INNER) {
      const p = await ctx.newPage();
      // sample the h1's opacity on every frame from the first one
      await p.addInitScript(() => {
        window.__h1min = 1;
        const tick = () => {
          const el = document.querySelector("h1");
          if (el) window.__h1min = Math.min(window.__h1min, Number(getComputedStyle(el).opacity));
          if (performance.now() < 4000) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
      await p.goto(base + href, { waitUntil: "load" });
      await p.waitForTimeout(600);
      check(`${tag} ${href}: the main heading is fully visible from the first frame`, (await p.evaluate(() => window.__h1min)) === 1);
      await waitPreloader(p);
      const entered = await p.evaluate(() => [...document.querySelectorAll(".page-enter, .page-enter-h1")].map((e) => getComputedStyle(e).animationName));
      check(`${tag} ${href}: the page header has its entrance (eyebrow, heading, intro)`, entered.length >= 3 && entered.every((n) => /page-enter/.test(n)), entered.join(","));
      const total = await p.evaluate(() => document.documentElement.scrollHeight);
      const first = await reveals(p);
      const hiddenBelow = first.filter((x) => x.top > x.h * 1.05);
      check(`${tag} ${href}: blocks below the fold wait to be scrolled to`, hiddenBelow.length === 0 || hiddenBelow.every((x) => x.o === 0), `${hiddenBelow.length} below`);
      for (let y = 0; y <= total; y += Math.round(h * 0.5)) { await scrollTo(p, y); await p.waitForTimeout(200); }
      await p.waitForTimeout(1200);
      const end = await reveals(p);
      check(`${tag} ${href}: every block ends revealed and fully visible`, end.every((x) => x.o > 0.99 && x.revealed));
      await scrollTo(p, 0);
      await p.screenshot({ path: `shots/004/${href.slice(1)}-${w}-top.png` });
      await p.close();
    }

    // Urdu feature on Our Way
    const p = await ctx.newPage();
    await p.goto(base + "/our-way", { waitUntil: "load" });
    await waitPreloader(p);
    const urdu = await p.evaluate(() => {
      const el = document.querySelector('[lang="ur"][dir="rtl"]');
      const bar = document.querySelector(".draw-in");
      return { text: el?.textContent?.trim(), size: el ? parseFloat(getComputedStyle(el).fontSize) : 0, barBefore: bar ? new DOMMatrixReadOnly(getComputedStyle(bar).transform).a : null, belowFold: bar ? bar.getBoundingClientRect().top > innerHeight : true };
    });
    check(`${tag} /our-way: the Urdu word is a large designed feature (at least 56px), marked lang=ur dir=rtl`, urdu.text === "طریق" && urdu.size >= 56, JSON.stringify(urdu));
    check(`${tag} /our-way: the saffron bar under it waits to be reached (when it starts below the fold)`, !urdu.belowFold || urdu.barBefore === 0, JSON.stringify(urdu));
    await p.locator('[lang="ur"]').scrollIntoViewIfNeeded();
    await p.waitForTimeout(1500);
    const barAfter = await p.evaluate(() => new DOMMatrixReadOnly(getComputedStyle(document.querySelector(".draw-in")).transform).a);
    check(`${tag} /our-way: the bar has drawn in after it is reached`, barAfter > 0.99, String(barAfter));
    await p.screenshot({ path: `shots/004/our-way-urdu-${w}.png` });
    await p.close();

    // Contact cards
    const c = await ctx.newPage();
    await c.goto(base + "/contact", { waitUntil: "load" });
    await waitPreloader(c);
    const cards = await c.evaluate(() => [...document.querySelectorAll("main ul > li .lift")].map((el) => el.textContent.trim().replace(/\s+/g, " ")));
    const links = await c.locator("main a[href^='https://wa.me/'], main a[href^='mailto:']").count();
    check(`${tag} /contact: each available detail is a styled card (${cards.length}) with its link`, cards.length >= 1 && links >= cards.length - 1, cards.join(" | "));
    check(`${tag} /contact: no form`, (await c.locator("main form").count()) === 0);
    await c.close();
    await ctx.close();
  }

  // copy unchanged: every line of text from before is still there, nothing else added except the trust strip
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
    const p = await ctx.newPage();
    const fs = await import("node:fs");
    // "Explore programs" is the hero's own button: its arrow icon made it a non-leaf under the old counting rule, so the "before" snapshot skipped it
    // feature 005: the carousel cards' compact faces repeat the step labels, and the carousel adds previous/next arrows
    const ALLOWED_NEW = new Set(["Hands-on learning", "Real projects", "In person or online", "Explore programs", "Prompt", "Build", "Learn", "‹", "›"]);
    for (const [name, href] of [["home", "/"], ["our-way", "/our-way"], ["programs", "/programs"], ["contact", "/contact"]]) {
      await p.goto(base + href, { waitUntil: "load" });
      await p.waitForTimeout(800);
      const after = (await p.locator("main").evaluate((el) => [...el.querySelectorAll("h1,h2,h3,h4,p,li,dt,dd,a,span,button")].map((n) => ([...n.children].every((c) => c.tagName.toLowerCase() === "svg") ? n.textContent.trim() : "")).filter(Boolean))).sort();
      const before = fs.readFileSync(`shots/004/text-before-${name}.txt`, "utf8").split("\n").filter(Boolean).sort();
      const count = (arr) => arr.reduce((m, x) => ((m[x] = (m[x] || 0) + 1), m), {});
      const cb = count(before), ca = count(after);
      const removed = Object.keys(cb).filter((k) => (ca[k] || 0) < cb[k]);
      const added = Object.keys(ca).filter((k) => (cb[k] || 0) < ca[k] && !ALLOWED_NEW.has(k));
      check(`[copy] ${href}: no text removed or changed, none added (trust strip excepted)`, removed.length === 0 && added.length === 0, `removed: ${removed.join(" | ")}; added: ${added.join(" | ")}`);
    }
    await ctx.close();
  }
}

// ---------- H. hero-area additions: outside the hero, the hero itself unchanged ----------
if (want("hero")) {
  const FACTS = ["Hands-on learning", "Real projects", "In person or online"];
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const tag = `[${w}px]`;
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    const p = await ctx.newPage();
    await p.goto(base + "/", { waitUntil: "load" });
    await waitPreloader(p);
    const info = await p.evaluate(() => {
      const hero = document.querySelector("main").firstElementChild;
      const cue = document.querySelector('a[aria-label="Scroll to the next section"]');
      const strip = document.querySelector('ul[aria-label="At a glance"]');
      const hb = hero.getBoundingClientRect();
      const cb = cue.getBoundingClientRect();
      return {
        cueOutsideHero: !hero.contains(cue),
        stripOutsideHero: !hero.contains(strip),
        stripText: [...strip.querySelectorAll("li")].map((l) => l.textContent.trim()),
        cueDisplay: getComputedStyle(cue).display,
        cueHref: cue.getAttribute("href"),
        cueSize: [Math.round(cb.width), Math.round(cb.height)],
        cueBottom: Math.round(cb.bottom),
        heroBottom: Math.round(hb.bottom),
        heroH: Math.round(hb.height),
        header: parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) * 16 || 0,
      };
    });
    check(`${tag} the scroll cue and the trust strip sit outside the hero element`, info.cueOutsideHero && info.stripOutsideHero);
    check(`${tag} the trust strip shows exactly the confirmed facts`, JSON.stringify(info.stripText) === JSON.stringify(FACTS), info.stripText.join(" | "));
    if (w >= 1024) {
      check(`${tag} the cue is visible over the bottom edge of the first screen, at least 44px, inside the viewport`, info.cueDisplay !== "none" && info.cueSize[0] >= 44 && info.cueSize[1] >= 44 && info.cueBottom <= h && info.cueBottom > h - 120, JSON.stringify(info));
      check(`${tag} the hero is still exactly one screen below the header`, Math.abs(info.heroH - (h - 80)) <= 1, `${info.heroH} vs ${h - 80}`);
      await p.screenshot({ path: `shots/004/hero-extras-${w}.png` });
      await p.locator('a[aria-label="Scroll to the next section"]').click();
      await p.waitForTimeout(1500);
      const toWho = await p.evaluate(() => Math.round(document.querySelector("#programs").getBoundingClientRect().top)); // feature 008: the cue targets Programs
      check(`${tag} the cue scrolls to the first section`, toWho >= -5 && toWho <= 120, String(toWho));
    } else {
      check(`${tag} the cue is not shown on a phone (the hero already runs past the fold)`, info.cueDisplay === "none");
      await scrollTo(p, 700);
      await p.waitForTimeout(1200);
      await p.screenshot({ path: `shots/004/hero-extras-${w}.png` });
    }
    await ctx.close();
  }
  // reduced motion: the cue is still
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
    const p = await ctx.newPage();
    await p.goto(base + "/", { waitUntil: "load" });
    await p.waitForTimeout(800);
    const anim = await p.evaluate(() => getComputedStyle(document.querySelector(".cue")).animationName);
    check("[reduced motion] the scroll cue does not animate", anim === "none", anim);
    await ctx.close();
  }
  // motion: the cue bobs
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage();
    await p.goto(base + "/", { waitUntil: "load" });
    await waitPreloader(p);
    const anim = await p.evaluate(() => getComputedStyle(document.querySelector(".cue")).animationName);
    check("[motion] the scroll cue bobs (transform only)", anim === "cue-bob", anim);
    await ctx.close();
  }
}

// ---------- I. accessibility: headings, landmarks, focus not hidden under the sticky header, decorative hidden ----------
if (want("a11y")) {
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const tag = `[${w}px]`;
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    const p = await ctx.newPage();
    for (const href of PAGES) {
      await p.goto(base + href, { waitUntil: "load" });
      await waitPreloader(p);
      const info = await p.evaluate(() => {
        const heads = [...document.querySelectorAll("h1,h2,h3,h4")].map((x) => Number(x.tagName[1]));
        let skip = false;
        for (let i = 1; i < heads.length; i++) if (heads[i] - heads[i - 1] > 1) skip = true;
        const heroEl = document.querySelector("main").firstElementChild; // the hero is finished and out of scope here
        const deco = [...document.querySelectorAll("main svg:not([aria-hidden='true'])")].filter((s) => !heroEl.contains(s) && !s.closest("[aria-hidden='true']") && !s.getAttribute("aria-label") && !s.querySelector("title")).length;
        return { h1: heads.filter((n) => n === 1).length, skip, landmarks: ["header", "nav", "main", "footer"].map((t) => document.querySelectorAll(t).length), deco };
      });
      check(`${tag} ${href}: one h1, no skipped heading level, header/nav/main/footer present`, info.h1 === 1 && !info.skip && info.landmarks.every((n) => n >= 1), JSON.stringify(info));
      check(`${tag} ${href}: every icon in the page is hidden from assistive technology`, info.deco === 0, String(info.deco));
    }
    // focus is never hidden under the sticky header: Tab through /programs and check each focused element sits below it
    await p.goto(base + "/programs", { waitUntil: "load" });
    await waitPreloader(p);
    await p.addStyleTag({ content: "html { scroll-behavior: auto !important; }" }); // measure after the jump, not mid smooth scroll
    const hidden = [];
    for (let i = 0; i < 24; i++) {
      await p.keyboard.press("Tab");
      await p.waitForTimeout(120);
      const r = await p.evaluate(() => {
        const el = document.activeElement;
        const hb = document.querySelector("header").getBoundingClientRect();
        const b2 = el.getBoundingClientRect();
        const inHeader = !!el.closest("header");
        return { inHeader, tag: el.tagName, top: b2.top, headerBottom: hb.bottom, text: (el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 20) };
      });
      const skipLink = /^Skip to content/.test(r.text); // fixed above the header on purpose
      if (!r.inHeader && !skipLink && r.tag !== "BODY" && r.top < r.headerBottom - 1) hidden.push(`${r.text} (top ${Math.round(r.top)})`);
    }
    check(`${tag} /programs: no focused element ends up under the sticky header`, hidden.length === 0, hidden.join(" | "));
    await ctx.close();
  }
}

await b.close();
console.log(results.join("\n"));
console.log(results.some((r) => r.startsWith("FAIL")) ? "\nSOME CHECKS FAILED" : "\nALL CHECKS PASSED");
process.exit(results.some((r) => r.startsWith("FAIL")) ? 1 : 0);
