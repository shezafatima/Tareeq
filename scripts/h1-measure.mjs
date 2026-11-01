import { chromium } from "@playwright/test";
const b = await chromium.launch({ executablePath: process.env.CHROME });
for (const [w, h] of [[1024, 768], [1280, 720], [1440, 900], [1920, 1080], [768, 1024], [390, 844], [360, 740]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.goto((process.env.BASE ?? "http://localhost:3000") + "/", { waitUntil: "load" });
  await p.waitForTimeout(2000);
  const r = await p.evaluate(() => {
    const h1 = document.getElementById("hero-title");
    const spans = [...h1.querySelectorAll("span.block")];
    const rect = h1.getBoundingClientRect();
    const lines = spans.map((s) => { const g = document.createRange(); g.selectNodeContents(s); const rs = [...g.getClientRects()]; return Math.round(Math.max(...rs.map((x) => x.right)) - Math.min(...rs.map((x) => x.left))); });
    return { fs: getComputedStyle(h1).fontSize, colW: Math.round(rect.width), h: Math.round(rect.height), lineW: lines, rows: Math.round(rect.height / parseFloat(getComputedStyle(h1).lineHeight)) };
  });
  console.log(w + "x" + h, JSON.stringify(r));
  await p.close();
}
await b.close();
