import { chromium } from "@playwright/test";
const b = await chromium.launch({ executablePath: process.env.CHROME });
const logs = [];
const track = (p, n) => {
  p.on("console", (m) => { if (["error", "warning"].includes(m.type())) logs.push(`[${n}] ${m.text()}`); });
  p.on("pageerror", (e) => logs.push(`[${n}] ${e.message}`));
};
const SVG = 'svg[viewBox="0 0 1024 1536"]';
const headClip = (p) => p.evaluate((S) => {
  const r = document.querySelector(S).getBoundingClientRect();
  const x = r.left + r.width * 0.36, y = r.top + r.height * 0.0, w = r.width * 0.62, h = r.height * 0.3;
  return { x: Math.max(0, x), y: Math.max(0, y), width: w, height: h };
}, SVG);

// numeric check (debug page): every sampled eye point must be inside the inset clip rect
const inside = (p) => p.evaluate((S) => {
  const svg = document.querySelector(S);
  const clip = svg.querySelector('rect[stroke-dasharray="5 4"]');
  const inv = clip.getScreenCTM().inverse();
  const cw = +clip.getAttribute("width"), ch = +clip.getAttribute("height");
  const cxm = +clip.getAttribute("x") + cw / 2, cym = +clip.getAttribute("y") + ch / 2;
  const eyes = [...svg.querySelectorAll("g[filter] > g")];
  let worst = 1e9, bad = 0, total = 0;
  const test = (el, pts) => {
    const m = el.getScreenCTM();
    for (const [x, y] of pts) {
      const lp = new DOMPoint(x, y).matrixTransform(m).matrixTransform(inv);
      total++;
      if (!clip.isPointInFill(lp)) bad++;
      worst = Math.min(worst, Math.min(cw / 2 - Math.abs(lp.x - cxm), ch / 2 - Math.abs(lp.y - cym)));
    }
  };
  for (const g of eyes) {
    const rect = g.querySelector("rect"), path = g.querySelector("path");
    const ro = +getComputedStyle(rect).opacity, po = +getComputedStyle(path).opacity;
    if (ro > 0.5) {
      const w = +rect.getAttribute("width"), h = +rect.getAttribute("height"), x = +rect.getAttribute("x"), y = +rect.getAttribute("y");
      test(rect, [[x + w / 2, y], [x + w / 2, y + h], [x, y + h / 2], [x + w, y + h / 2], [x + w * 0.15, y + h * 0.1], [x + w * 0.85, y + h * 0.1], [x + w * 0.15, y + h * 0.9], [x + w * 0.85, y + h * 0.9]]);
    }
    if (po > 0.5) {
      const L = path.getTotalLength(), sw = parseFloat(path.getAttribute("stroke-width")) / 2;
      const pts = [];
      for (let i = 0; i <= 20; i++) { const q = path.getPointAtLength((L * i) / 20); pts.push([q.x, q.y - sw], [q.x, q.y + sw], [q.x - sw, q.y], [q.x + sw, q.y]); }
      test(path, pts);
    }
  }
  return { sampledPoints: total, outsideClip: bad, minMarginPx: Math.round(worst) };
}, SVG);

const eyeLineAngle = (p) => p.evaluate((S) => {
  const rects = [...document.querySelector(S).querySelectorAll("g[filter] > g rect")];
  const c = rects.map((r) => { const bb = r.getBBox(); return new DOMPoint(bb.x + bb.width / 2, bb.y + bb.height / 2).matrixTransform(r.getScreenCTM()); });
  return +(Math.atan2(c[1].y - c[0].y, c[1].x - c[0].x) * 180 / Math.PI).toFixed(2);
}, SVG);

const pts = [["topleft", 3, 82], ["topright", 1436, 82], ["bottomleft", 3, 897], ["bottomright", 1436, 897], ["top", 720, 82], ["bottom", 720, 897], ["left", 3, 450], ["right", 1436, 450]];
const load = async (qs) => {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  track(p, qs || "plain");
  await p.goto("http://localhost:3100/" + qs, { waitUntil: "load" });
  await p.waitForTimeout(3500);
  return p;
};
const plain = await load("");
const dbg = await load("?eyes-debug=1");

await plain.screenshot({ path: "shots/t_1440.png", timeout: 120000 });
await dbg.screenshot({ path: "shots/t_debug_full.png", timeout: 120000 });
await dbg.screenshot({ path: "shots/t_debug_head.png", clip: await headClip(dbg), timeout: 120000 });
console.log("eye-line angle (deg, screen):", await eyeLineAngle(plain), "| expected VISOR_ANGLE 9.87");
console.log("idle inside-check:", JSON.stringify(await inside(dbg)));

for (const [name, x, y] of pts) {
  for (const pg of [plain, dbg]) await pg.mouse.move(x, y, { steps: 6 });
  await plain.waitForTimeout(1400);
  await plain.screenshot({ path: `shots/t_${name}.png`, clip: await headClip(plain), timeout: 120000 });
  await dbg.screenshot({ path: `shots/t_${name}_dbg.png`, clip: await headClip(dbg), timeout: 120000 });
  console.log(name.padEnd(12), JSON.stringify(await inside(dbg)));
}
for (const id of ["prompt", "build", "learn"]) {
  for (const pg of [plain, dbg]) await pg.locator(`[data-hero-card=${id}]`).hover();
  await plain.waitForTimeout(1200);
  await plain.screenshot({ path: `shots/t_hover_${id}.png`, clip: await headClip(plain), timeout: 120000 });
  await dbg.screenshot({ path: `shots/t_hover_${id}_dbg.png`, clip: await headClip(dbg), timeout: 120000 });
  await plain.screenshot({ path: `shots/t_hover_${id}_full.png`, timeout: 120000 });
  console.log(("hover " + id).padEnd(12), JSON.stringify(await inside(dbg)), "eye-line", await eyeLineAngle(plain));
  for (const pg of [plain, dbg]) await pg.mouse.move(700, 880);
  await plain.waitForTimeout(500);
}
// drift back after the cursor stops
await plain.mouse.move(3, 450, { steps: 4 });
await plain.waitForTimeout(900);
const off = () => plain.evaluate((S) => { const g = document.querySelector(S + " g[clip-path] > g > g"); const m = new DOMMatrix(getComputedStyle(g).transform); return [+m.e.toFixed(1), +m.f.toFixed(1)]; }, SVG);
const a = await off();
await plain.waitForTimeout(9000);
console.log("drift: looking left", JSON.stringify(a), "-> after 9s idle", JSON.stringify(await off()));
const t = () => plain.evaluate(() => getComputedStyle(document.querySelector(".gradients-container > div")).transform);
const g1 = await t();
await plain.waitForTimeout(2000);
console.log("gradient:", g1 !== (await t()) ? "ANIMATING" : "STATIC");

// touch
const tctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
const tp = await tctx.newPage();
track(tp, "touch");
await tp.goto("http://localhost:3100/", { waitUntil: "load" });
await tp.waitForTimeout(3500);
await tp.evaluate(() => window.scrollTo(0, 420));
await tp.waitForTimeout(400);
await tp.screenshot({ path: "shots/t_390.png", timeout: 120000 });
const w = [];
for (let i = 0; i < 9; i++) {
  await tp.waitForTimeout(1000);
  w.push(JSON.stringify(await tp.evaluate((S) => { const g = document.querySelector(S + " g[clip-path] > g > g"); const m = new DOMMatrix(getComputedStyle(g).transform); return [Math.round(m.e), Math.round(m.f)]; }, SVG)));
}
console.log("touch wander offsets:", w.join(" "));
await tp.locator("[data-hero-card=build]").tap();
await tp.waitForTimeout(1000);
await tp.screenshot({ path: "shots/t_touch_build.png", timeout: 120000 });
await tctx.close();

const rp = await b.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
track(rp, "reduced");
await rp.goto("http://localhost:3100/", { waitUntil: "load" });
await rp.waitForTimeout(1500);
await rp.mouse.move(3, 450, { steps: 3 });
await rp.waitForTimeout(800);
await rp.locator("[data-hero-card=prompt]").hover();
await rp.waitForTimeout(600);
await rp.screenshot({ path: "shots/t_reduced_hover.png", clip: await headClip(rp), timeout: 120000 });
console.log("console:", logs.length ? "\n" + logs.join("\n") : "none");
await b.close();
