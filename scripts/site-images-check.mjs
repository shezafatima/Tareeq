// Browser checks for feature 030 tasks T028 (the founder photo slot) and T031 (the server refuses a bad image on save).
// Usage: ADMIN_EMAIL=... ADMIN_PASSWORD=... BASE=http://localhost:3100 [CHROME=<path>] node scripts/site-images-check.mjs
// Run it against a server started with the same ADMIN_EMAIL and an ADMIN_PASSWORD_HASH made from ADMIN_PASSWORD.
// Development database only. The current site images record is set aside first and restored exactly at the end, so an
// uploaded founder photo is never replaced (which would delete its Cloudinary file). Every asset this run creates is deleted.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { crc32, deflateSync } from "node:zlib";
import { randomBytes } from "node:crypto";
import { chromium } from "@playwright/test";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

const base = process.env.BASE ?? "http://localhost:3100";
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
if (!email || !password) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD (the plain password behind the running server's hash).");
  process.exit(2);
}
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    }),
);
const cloud = env.CLOUDINARY_CLOUD_NAME;
cloudinary.config({ cloud_name: cloud, api_key: env.CLOUDINARY_API_KEY, api_secret: env.CLOUDINARY_API_SECRET, secure: true });

const REJECTED = "This image could not be accepted. Upload it again.";
const SAVED = "Images saved. The site now shows them.";
const DEFAULT_SRC = "/founder.jpeg";

const shots = "shots/030";
const fixtures = `${shots}/fixtures`;
mkdirSync(fixtures, { recursive: true });
const jpg = `${fixtures}/cover.jpg`;
writeFileSync(jpg, readFileSync("public/founder.jpeg"));

const results = [];
const check = (name, ok, extra = "") => {
  results.push(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  (" + extra + ")" : ""}`);
  console.log(results.at(-1));
};
const created = new Set(); // publicIds this run created

// a PNG of random noise: it does not compress, so 1400 x 1400 RGB is about 5.9 MB, over the 5 MB limit
function noisePng(size) {
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(td));
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  const rows = [];
  for (let y = 0; y < size; y++) rows.push(Buffer.from([0]), randomBytes(size * 3));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(Buffer.concat(rows), { level: 0 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
const minimalPdf = Buffer.from(
  "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n" +
    "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n",
);
const gifBytes = Buffer.from("R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==", "base64");

const assetExists = async (publicId) => {
  try {
    await cloudinary.api.resource(publicId, { resource_type: "image", type: "upload" });
    return true;
  } catch (e) {
    if (e?.error?.http_code === 404) return false;
    throw e;
  }
};
const assetGone = async (publicId) => {
  for (let i = 0; i < 10; i++) {
    if (!(await assetExists(publicId))) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
};

const browser = await chromium.launch({ executablePath: process.env.CHROME });
await mongoose.connect(env.MONGODB_URI);
const db = mongoose.connection.db;
const siteImages = db.collection("siteimages");
const backup = await siteImages.findOne({ _id: "images" });
const run = Math.random().toString(36).slice(2, 8);
const startedAt = Date.now() - 5000;
let programId = null;

const freshAddress = () => `198.${18 + Math.floor(Math.random() * 2)}.${Math.floor(Math.random() * 256)}.${1 + Math.floor(Math.random() * 254)}`;
async function session(viewport, reducedMotion = "no-preference") {
  const context = await browser.newContext({ viewport, reducedMotion });
  context.setDefaultTimeout(90000); // the database can be slow from here
  const address = freshAddress();
  // sent to our server only: sent to Cloudinary, the extra header fails its CORS preflight
  await context.route(`${base}/**`, (route) => route.continue({ headers: { ...route.request().headers(), "x-forwarded-for": address } }));
  const page = await context.newPage();
  await page.goto(`${base}/admin/login`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL((u) => !u.pathname.endsWith("/admin/login"), { timeout: 90000 });
  return { context, page };
}
const settle = async (page, url) => {
  await page.goto(url, { waitUntil: "load" });
  await page.waitForTimeout(2000); // hydration
};
const noHScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

// the mentor photo on the home page, scrolled into view so the lazy image loads (or fails and falls back)
// waits up to 60 s for `expect` in the src with the image loaded: the image proxy can be slow to reach Cloudinary from here
async function homePhoto(page, expect) {
  await page.goto(`${base}/`, { waitUntil: "load" });
  const img = page.locator(".mentor-glow ~ div img").first();
  await img.scrollIntoViewIfNeeded();
  const read = () => img.evaluate((el) => ({ src: decodeURIComponent(el.getAttribute("src") ?? ""), alt: el.getAttribute("alt"), ok: el.complete && el.naturalWidth > 0 }));
  let state = await read();
  const start = Date.now();
  while (Date.now() - start < 60000 && !(state.src.includes(expect) && state.ok)) {
    await page.waitForTimeout(1000);
    state = await read();
  }
  state.seconds = Math.round((Date.now() - start) / 1000);
  return state;
}

const founderAlt = (page) => page.locator("#slot-founderPhoto-alt");
const saveImages = (page) => page.getByRole("button", { name: "Save images" });

try {
  // start from an empty slot (the saved record is restored in finally; its Cloudinary file is never touched)
  await siteImages.updateOne({ _id: "images" }, { $unset: { founderPhoto: 1 } });

  // ======== T028 at 1440
  {
    const { context, page } = await session({ width: 1440, height: 900 });
    await settle(page, `${base}/admin/settings`);
    const link = page.locator('a[href="/admin/settings/images"]');
    check("Settings links to the images page", (await link.count()) > 0);
    await link.first().click();
    await page.waitForURL(/\/admin\/settings\/images$/);
    await page.waitForTimeout(1500);
    const preview = page.locator(`img[src="${DEFAULT_SRC}"]`);
    check("empty slot previews the default /founder.jpeg", (await preview.count()) > 0);
    check("empty slot shows the Default chip", (await page.getByText("Default", { exact: true }).count()) > 0);
    check("recommended size is shown", (await page.getByText(/Recommended: 1122 x 1402 px/).count()) > 0);
    check("Save images is disabled with no changes", await saveImages(page).isDisabled());

    await page.locator('input[type="file"]').setInputFiles(jpg);
    await founderAlt(page).waitFor({ state: "visible", timeout: 60000 });
    check("unsaved-changes note shows after choosing an image", (await page.getByText("You have unsaved changes.").count()) > 0);
    await saveImages(page).click();
    await page.getByText("Please check the highlighted fields.").first().waitFor({ timeout: 10000 });
    check("save without alt text is blocked", (await founderAlt(page).getAttribute("aria-invalid")) === "true");
    await founderAlt(page).fill(`T028 test founder photo ${run}`);
    await saveImages(page).click();
    await page.getByText(SAVED).first().waitFor({ timeout: 90000 });
    const doc = await siteImages.findOne({ _id: "images" });
    const photo = doc?.founderPhoto;
    if (photo?.publicId) created.add(photo.publicId);
    check("saved founder photo is stored in tareeq/site", Boolean(photo?.publicId?.startsWith("tareeq/site/") && photo.width > 0 && photo.height > 0), photo?.publicId);

    let home = await homePhoto(page, photo.publicId);
    check("home page shows the new photo on the next load", home.src.includes(photo.publicId) && home.ok, `${home.seconds}s ${home.src.slice(0, 110)}`);
    check("home page photo uses the saved alt text", home.alt === `T028 test founder photo ${run}`);

    await settle(page, `${base}/admin/settings/images`);
    await page.getByRole("button", { name: "Use default image" }).click();
    await saveImages(page).click();
    await page.getByText(SAVED).first().waitFor({ timeout: 90000 });
    const after = await siteImages.findOne({ _id: "images" });
    check("Use default clears the slot", !after?.founderPhoto);
    check("Use default deletes the old Cloudinary file", await assetGone(photo.publicId));
    home = await homePhoto(page, DEFAULT_SRC);
    check("home page returns to /founder.jpeg", home.src.includes(DEFAULT_SRC) && home.ok, `${home.seconds}s ${home.src.slice(0, 110)}`);

    // a broken stored URL: the page shows the default file, never a broken image
    const brokenId = `tareeq/site/t028-missing-${run}`;
    await siteImages.updateOne(
      { _id: "images" },
      { $set: { founderPhoto: { url: `https://res.cloudinary.com/${cloud}/image/upload/v1/${brokenId}.jpg`, publicId: brokenId, width: 1122, height: 1402, alt: "broken" } } },
    );
    // change only the alt text so the form can save, which refreshes the cached site images (same publicId: no Cloudinary call)
    await settle(page, `${base}/admin/settings/images`);
    await founderAlt(page).fill(`Broken ${run}`);
    await saveImages(page).click();
    await page.getByText(SAVED).first().waitFor({ timeout: 90000 });
    home = await homePhoto(page, DEFAULT_SRC);
    check("broken slot URL falls back to /founder.jpeg with no broken image", home.src.includes(DEFAULT_SRC) && home.ok, `${home.seconds}s ${home.src.slice(0, 110)}`);
    await page.screenshot({ path: `${shots}/t028-home-fallback.png` });
    await siteImages.updateOne({ _id: "images" }, { $unset: { founderPhoto: 1 } });
    await context.close();
  }

  // ======== T028 at 360, keyboard, reduced motion
  {
    const { context, page } = await session({ width: 360, height: 780 }, "reduce");
    await settle(page, `${base}/admin/settings/images`);
    check("360: no horizontal scroll on the images page", await noHScroll(page));
    const zone = page.getByRole("button", { name: /Choose an image/ });
    let reached = false;
    for (let i = 0; i < 60 && !reached; i++) {
      await page.keyboard.press("Tab");
      reached = await zone.evaluate((el) => el === document.activeElement);
    }
    check("360: the founder uploader is reachable with Tab", reached);
    await page.screenshot({ path: `${shots}/t028-admin-360.png`, fullPage: true });
    await page.goto(`${base}/`, { waitUntil: "load" });
    await page.locator(".mentor-glow ~ div img").first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    check("360: no horizontal scroll on the home page", await noHScroll(page));
    await context.close();
  }

  // ======== T031: the server re-checks the image on save
  {
    const now = new Date();
    ({ insertedId: programId } = await db.collection("programs").insertOne({
      title: `T031 test program ${run}`, slug: `zz-t031-program-${run}`, audience: "teachers", status: "coming-soon", ctaType: "register",
      summary: "Temporary record for the server check.", description: "", outcomes: [], curriculum: [], facts: {}, priceText: "",
      order: 999, published: false, createdAt: now, updatedAt: now,
    }));
    const up = async (buf, name, opts = {}) => {
      const r = await new Promise((res, rej) =>
        cloudinary.uploader.upload_stream({ folder: "tareeq/program", public_id: `t031-${name}-${run}`, ...opts }, (e, v) => (e ? rej(e) : res(v))).end(buf),
      );
      created.add(r.public_id);
      return r;
    };
    const big = await up(noisePng(1400), "big");
    const pdf = await up(minimalPdf, "pdf");
    const gif = await up(gifBytes, "gif");
    console.log(`  fixtures: big ${big.format} ${(big.bytes / 1048576).toFixed(1)} MB, pdf as ${pdf.resource_type}/${pdf.format}, gif ${gif.format}`);

    const cases = [
      { name: "oversized PNG (over 5 MB)", id: big.public_id, deletes: true },
      { name: "non-image (PDF)", id: pdf.public_id, deletes: true },
      { name: "format not allowed (GIF)", id: gif.public_id, deletes: true },
      { name: "wrong folder", id: `samples/t031-${run}`, deletes: false },
      { name: "nonexistent id", id: `tareeq/program/t031-missing-${run}`, deletes: false },
    ];
    const { context, page } = await session({ width: 1440, height: 900 });
    for (const c of cases) {
      // the upload reply is replaced, as a tampered client would do; the server must catch it on save
      await page.route("https://api.cloudinary.com/**", (route) =>
        route.fulfill({
          status: 200,
          headers: { "access-control-allow-origin": "*" },
          contentType: "application/json",
          body: JSON.stringify({ public_id: c.id, secure_url: `https://res.cloudinary.com/${cloud}/image/upload/v1/${c.id}.jpg`, width: 800, height: 450 }),
        }),
      );
      await settle(page, `${base}/admin/programs/${programId}/edit`);
      await page.locator('input[type="file"]').setInputFiles(jpg);
      await page.locator("#field-cover-alt").waitFor({ state: "visible", timeout: 90000 });
      await page.locator("#field-cover-alt").fill("tampered");
      await page.getByRole("button", { name: "Save changes" }).click();
      const shown = await page.getByText(REJECTED).first().waitFor({ timeout: 90000 }).then(() => true, () => false);
      const doc = await db.collection("programs").findOne({ _id: programId });
      check(`T031 ${c.name}: save refused with the rejected message`, shown);
      check(`T031 ${c.name}: record unchanged`, !doc.coverImage && !doc.coverImageUrl);
      if (c.deletes) check(`T031 ${c.name}: the bad asset is deleted from Cloudinary`, await assetGone(c.id));
      await page.unroute("https://api.cloudinary.com/**");
    }
    await context.close();
  }
} catch (err) {
  check("script ran to the end", false, err?.message?.split("\n").slice(0, 8).join(" / "));
  for (const ctx of browser.contexts()) for (const p of ctx.pages()) await p.screenshot({ path: `${shots}/failure.png`, fullPage: true }).catch(() => {});
} finally {
  await browser.close();
  // restore the site images record exactly as it was
  if (backup) await siteImages.replaceOne({ _id: "images" }, backup, { upsert: true });
  else await siteImages.deleteOne({ _id: "images" });
  const restored = await siteImages.findOne({ _id: "images" });
  check("site images record restored exactly", JSON.stringify(restored) === JSON.stringify(backup));
  if (backup?.founderPhoto?.publicId) check("the owner's founder photo file is still in Cloudinary", await assetExists(backup.founderPhoto.publicId));
  if (programId) await db.collection("programs").deleteOne({ _id: programId });
  // every asset this run uploaded (including unsaved ones), never one a record uses
  const keep = new Set();
  for (const col of ["programs", "courses"]) for (const d of await db.collection(col).find({ "coverImage.publicId": { $exists: true } }).toArray()) keep.add(d.coverImage.publicId);
  if (backup?.founderPhoto?.publicId) keep.add(backup.founderPhoto.publicId);
  for (const prefix of ["tareeq/site", "tareeq/program"]) {
    const res = await cloudinary.api.resources({ type: "upload", resource_type: "image", prefix, max_results: 100 }).catch(() => ({ resources: [] }));
    for (const r of res.resources) if (new Date(r.created_at).getTime() >= startedAt) created.add(r.public_id);
  }
  let destroyed = 0;
  for (const id of created) {
    if (keep.has(id)) continue;
    await cloudinary.uploader.destroy(id, { resource_type: "image", invalidate: true }).then(() => destroyed++, () => {});
  }
  console.log(`\ncleanup: restored site images, deleted the test program, destroyed ${destroyed} test assets (kept ${keep.size} in use)`);
  await mongoose.disconnect();
  const failed = results.filter((r) => r.startsWith("FAIL")).length;
  console.log(`\n${results.length - failed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}
