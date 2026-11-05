// Writes a first-frame WebP poster next to each "How it works" video and prints a size report.
// Usage: npm run posters:how-it-works   (uses Playwright Chromium and sharp, both already installed)
import { chromium } from "@playwright/test";
import sharp from "sharp";
import { statSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const dir = resolve("public/videos/how-it-works");
const ids = ["prompt", "build", "learn"];
const browser = await chromium.launch({ executablePath: process.env.CHROME });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

console.log("id      resolution   duration   mp4 (MB)   poster (KB)");
for (const id of ids) {
  const mp4 = resolve(dir, `${id}.mp4`);
  // opening the file directly gives a bare document with one <video>; this needs a browser with H.264
  // (Edge or Chrome; Playwright's bundled Chromium has no H.264). Set CHROME=<path to msedge.exe or chrome.exe>.
  await page.goto(pathToFileURL(mp4).href);
  await page.waitForFunction(() => document.querySelector("video")?.readyState >= 2, null, { timeout: 15000 });
  const info = await page.evaluate(async () => {
    const v = document.querySelector("video");
    v.controls = false;
    v.pause();
    v.muted = true;
    v.currentTime = 0;
    await new Promise((r) => setTimeout(r, 300));
    return { w: v.videoWidth, h: v.videoHeight, d: v.duration };
  });
  await page.setViewportSize({ width: info.w, height: info.h });
  await page.waitForTimeout(200);
  const png = await page.locator("video").screenshot();
  const out = resolve(dir, `${id}.webp`);
  await sharp(png).resize({ width: Math.min(info.w, 1280), withoutEnlargement: true }).webp({ quality: 80 }).toFile(out);
  const mb = (statSync(mp4).size / 1048576).toFixed(2);
  const kb = (statSync(out).size / 1024).toFixed(0);
  const warn = info.w > 1280 || statSync(mp4).size > 3 * 1048576 ? "  <-- OVER LIMIT" : "";
  console.log(`${id.padEnd(7)} ${`${info.w}x${info.h}`.padEnd(12)} ${info.d.toFixed(1).padStart(5)} s    ${mb.padStart(6)}     ${kb.padStart(6)}${warn}`);
}
await browser.close();
