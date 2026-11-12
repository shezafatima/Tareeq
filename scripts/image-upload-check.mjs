// Browser checks for the cover-image uploader (feature 030, task T020): quickstart steps 3, 4 and 5, at 360px and 1440px,
// keyboard only, and with reduced motion. Uses real Cloudinary uploads, so the CLOUDINARY_* values must be set.
// Usage: ADMIN_EMAIL=... ADMIN_PASSWORD=... BASE=http://localhost:3100 node scripts/image-upload-check.mjs
// Run it against a server started with the same ADMIN_EMAIL and an ADMIN_PASSWORD_HASH made from ADMIN_PASSWORD.
// It creates a temporary published program and course in the database named by MONGODB_URI, and deletes them, and every
// Cloudinary asset it uploaded, when it ends. Point it at a development database only.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
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

// .env.local, read the simple way: KEY=value, optional quotes
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    }),
);
cloudinary.config({ cloud_name: env.CLOUDINARY_CLOUD_NAME, api_key: env.CLOUDINARY_API_KEY, api_secret: env.CLOUDINARY_API_SECRET, secure: true });

const MSG = {
  type: "Use a JPG, PNG or WebP image.",
  size: "This image is over 5 MB. Choose a smaller one.",
  alt: "Describe the image in a few words (up to 200 characters).",
  uploadFailed: "The upload did not finish. Check your connection and try again.",
};

const shots = "shots/030";
mkdirSync(shots, { recursive: true });
const fixtures = `${shots}/fixtures`;
mkdirSync(fixtures, { recursive: true });

const results = [];
const check = (name, ok, extra = "") => {
  results.push(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  (" + extra + ")" : ""}`);
  console.log(results.at(-1));
};
const uploaded = new Set(); // every publicId this run created, destroyed at the end

// ---------- fixtures: a real JPG, a real PNG, a GIF, and a JPG over 5 MB
const jpg = `${fixtures}/cover.jpg`;
writeFileSync(jpg, readFileSync("public/founder.jpeg"));
const gif = `${fixtures}/not-allowed.gif`;
writeFileSync(gif, Buffer.from("R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==", "base64"));
const big = `${fixtures}/too-big.jpg`;
writeFileSync(big, Buffer.concat([readFileSync("public/founder.jpeg"), Buffer.alloc(6 * 1024 * 1024)]));
const png = `${fixtures}/replacement.png`;

// launch first: if the browser is missing, nothing has been created yet
const browser = await chromium.launch({ executablePath: process.env.CHROME });

// ---------- temporary records
await mongoose.connect(env.MONGODB_URI);
const db = mongoose.connection.db;
const run = Math.random().toString(36).slice(2, 8);
const programSlug = `zz-t020-program-${run}`;
const courseSlug = `zz-t020-course-${run}`;
const category = await db.collection("course_categories").findOne({});
if (!category) {
  console.error("No course category in the database; create one first.");
  process.exit(2);
}
const now = new Date();
const { insertedId: programId } = await db.collection("programs").insertOne({
  title: `T020 test program ${run}`, slug: programSlug, audience: "teachers", status: "coming-soon", ctaType: "register",
  summary: "Temporary record for the image upload check.", description: "", outcomes: [], curriculum: [], facts: {},
  priceText: "", coverImageUrl: "/founder.jpeg", order: 999, published: true, createdAt: now, updatedAt: now,
});
const { insertedId: courseId } = await db.collection("courses").insertOne({
  title: `T020 test course ${run}`, slug: courseSlug, category: category._id, level: "beginner", format: "live",
  summary: "Temporary record for the image upload check.", description: "", outcomes: [], curriculum: [],
  enrollmentStatus: "open", featured: false, order: 999, published: true, createdAt: now, updatedAt: now,
});
const getProgram = () => db.collection("programs").findOne({ _id: programId });
const getCourse = () => db.collection("courses").findOne({ _id: courseId });
const assetExists = async (publicId) => {
  try {
    await cloudinary.api.resource(publicId, { resource_type: "image", type: "upload" });
    return true;
  } catch (e) {
    if (e?.error?.http_code === 404) return false;
    throw e;
  }
};
// the old asset is deleted after the save responds; give it a moment
const assetGone = async (publicId) => {
  for (let i = 0; i < 10; i++) {
    if (!(await assetExists(publicId))) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
};

const freshAddress = () => `198.${18 + Math.floor(Math.random() * 2)}.${Math.floor(Math.random() * 256)}.${1 + Math.floor(Math.random() * 254)}`;

async function session(viewport, reducedMotion = "no-preference") {
  const context = await browser.newContext({ viewport, reducedMotion });
  // the made-up address goes to our server only: sent to Cloudinary, the extra header fails its CORS preflight
  const address = freshAddress();
  await context.route(`${base}/**`, (route) => route.continue({ headers: { ...route.request().headers(), "x-forwarded-for": address } }));
  const page = await context.newPage();
  await page.goto(`${base}/admin/login`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL((u) => !u.pathname.endsWith("/admin/login"), { timeout: 20000 });
  return { context, page };
}

// counts requests to Cloudinary's upload endpoint, so "nothing was uploaded" can be checked
function watchUploads(page) {
  const counter = { n: 0 };
  page.on("request", (r) => {
    if (r.url().startsWith("https://api.cloudinary.com/")) counter.n++;
  });
  page.on("response", async (r) => {
    if (r.url().startsWith("https://api.cloudinary.com/") && (!r.ok() || process.env.DEBUG)) console.log(`  cloudinary ${r.status()}: ${(await r.text().catch(() => "")).slice(0, 200)}`);
  });
  page.on("requestfailed", (r) => {
    if (r.url().startsWith("https://api.cloudinary.com/")) console.log(`  cloudinary request failed: ${r.failure()?.errorText}`);
  });
  return counter;
}

const zone = (page) => page.locator("#field-cover-error");
const altInput = (page) => page.locator("#field-cover-alt");
const fileInput = (page) => page.locator('input[type="file"]');

async function upload(page, file) {
  await fileInput(page).setInputFiles(file);
  await altInput(page).waitFor({ state: "visible", timeout: 60000 });
}

async function save(page, okToast) {
  await page.getByRole("button", { name: "Save changes" }).click();
  if (okToast) await page.getByText(okToast).first().waitFor({ timeout: 30000 });
}

const noHScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

// public card and detail page: the cover img (or none), plus the share image
async function publicCover(page, listPath, slug) {
  // "load", not "networkidle": public pages keep media requests open
  await page.goto(`${base}${listPath}`, { waitUntil: "load" });
  await page.waitForTimeout(1500);
  // the card is the nearest ancestor of the link that also holds the cover (a program panel puts the cover beside the link)
  const card = await page.evaluate((href) => {
    const a = document.querySelector(`a[href="${href}"]`);
    if (!a) return { found: false, img: null };
    for (let el = a; el && el !== document.body; el = el.parentElement) {
      if (el.querySelector(".program-pattern")) {
        const img = el.querySelector(".program-pattern img");
        return { found: true, img: img ? img.getAttribute("src") : null };
      }
    }
    return { found: true, img: null };
  }, `${listPath}/${slug}`);
  const cardFound = card.found;
  const cardImg = card.img;
  await page.goto(`${base}${listPath}/${slug}`, { waitUntil: "load" });
  await page.waitForTimeout(1500);
  const imgs = await page.locator("main img").evaluateAll((els) => els.map((e) => ({ src: e.getAttribute("src") ?? "", ok: e.complete && e.naturalWidth > 0 })));
  const og = await page.locator('meta[property="og:image"]').first().getAttribute("content").catch(() => null);
  return { cardFound, cardImg, imgs, og };
}
const mentions = (src, needle) => decodeURIComponent(src ?? "").includes(needle);

try {
  // ======== Program, desktop 1440
  {
    const { context, page } = await session({ width: 1440, height: 900 });
    const uploads = watchUploads(page);
    await page.goto(`${base}/admin/programs/${programId}/edit`);

    // legacy URL record: shown as the current image, replaceable
    await page.getByText("Replace image").waitFor();
    const legacyPreview = await page.locator('img[src="/founder.jpeg"]').count();
    check("program 1440: legacy URL shows as the current image with Replace and Remove", legacyPreview > 0 && (await page.getByRole("button", { name: "Remove image" }).count()) === 1);

    // save once unchanged so the public cache is refreshed, then the legacy image renders publicly
    await save(page, "Program saved");
    let pub = await publicCover(page, "/programs", programSlug);
    check("program: legacy URL renders on the card", pub.cardFound && mentions(pub.cardImg, "founder.jpeg"), pub.cardFound ? pub.cardImg : "card not found");
    check("program: legacy URL renders on the detail page", pub.imgs.some((i) => mentions(i.src, "founder.jpeg") && i.ok));
    await page.goto(`${base}/admin/programs/${programId}/edit`);
    await page.getByText("Replace image").waitFor();

    // step 3: wrong type, too big, network off
    await fileInput(page).setInputFiles(gif);
    check("program 1440: GIF rejected with the type message", (await zone(page).textContent())?.trim() === MSG.type);
    check("program 1440: GIF not uploaded", uploads.n === 0);
    await page.getByRole("button", { name: "Dismiss" }).click();
    await fileInput(page).setInputFiles(big);
    check("program 1440: 6 MB JPG rejected with the size message", (await zone(page).textContent())?.trim() === MSG.size);
    check("program 1440: 6 MB JPG not uploaded", uploads.n === 0);
    await page.getByRole("button", { name: "Dismiss" }).click();

    await page.route("https://api.cloudinary.com/**", (r) => r.abort("internetdisconnected"));
    await fileInput(page).setInputFiles(jpg);
    await page.getByText(MSG.uploadFailed).waitFor({ timeout: 30000 });
    check("program 1440: Cloudinary unreachable shows the upload-failed message", true);
    check("program 1440: after a failed upload the legacy image is still the current one", (await page.locator('img[src="/founder.jpeg"]').count()) > 0);
    await page.unroute("https://api.cloudinary.com/**");
    await page.getByRole("button", { name: "Dismiss" }).click();
    let doc = await getProgram();
    check("program: record unchanged after rejected files", doc.coverImageUrl === "/founder.jpeg" && !doc.coverImage);

    // step 4: a real upload with no alt text is blocked at the alt field
    await upload(page, jpg);
    check("program 1440: upload shows the alt text field", await altInput(page).isVisible());
    await save(page);
    await page.getByText(MSG.alt).first().waitFor({ timeout: 10000 });
    check("program 1440: save without alt text is blocked with the alt message", (await altInput(page).getAttribute("aria-invalid")) === "true");
    doc = await getProgram();
    check("program: record unchanged after the blocked save", doc.coverImageUrl === "/founder.jpeg" && !doc.coverImage);
    await page.screenshot({ path: `${shots}/program-1440-alt-error.png`, fullPage: true });

    // step 5: add alt text and save
    await altInput(page).fill("Test cover image");
    await save(page, "Program saved");
    doc = await getProgram();
    const first = doc.coverImage;
    if (first?.publicId) uploaded.add(first.publicId);
    check(
      "program: saved image has url, publicId, width, height and alt, in tareeq/program",
      Boolean(first?.url?.startsWith("https://res.cloudinary.com/") && first.publicId.startsWith("tareeq/program") && first.width > 0 && first.height > 0 && first.alt === "Test cover image"),
      first?.publicId,
    );
    check("program: legacy URL cleared once replaced", !doc.coverImageUrl);
    pub = await publicCover(page, "/programs", programSlug);
    check("program: card shows the uploaded image", pub.cardFound && mentions(pub.cardImg, first.publicId), pub.cardImg);
    check("program: detail page shows the uploaded image and it loads", pub.imgs.some((i) => mentions(i.src, first.publicId) && i.ok));
    check("program: share image uses the uploaded image", mentions(pub.og, first.publicId), pub.og);
    check("program: public image is served through next/image with auto format and quality", pub.imgs.some((i) => i.src.includes("/_next/image") && mentions(i.src, "f_auto,q_auto")), pub.imgs.map((i) => i.src.slice(0, 60)).join(" | "));
    await page.screenshot({ path: `${shots}/program-1440-public.png`, fullPage: false });

    // replace with a PNG: the old asset is deleted
    await page.screenshot({ path: png });
    await page.goto(`${base}/admin/programs/${programId}/edit`);
    await page.getByText("Replace image").waitFor();
    check("program 1440: alt text field shows the saved alt", (await altInput(page).inputValue()) === "Test cover image");
    await fileInput(page).setInputFiles(png);
    await page.getByRole("progressbar").waitFor({ timeout: 10000 }).then(
      () => check("program 1440: progress bar shows during upload", true),
      () => check("program 1440: progress bar shows during upload", false, "upload finished before it was seen"),
    );
    await altInput(page).waitFor({ state: "visible", timeout: 60000 });
    const replaceError = await zone(page).textContent();
    if (replaceError?.trim()) console.log(`  uploader error after replace: ${replaceError.trim()}`);
    check("program 1440: alt text kept when the image is replaced", (await altInput(page).inputValue()) === "Test cover image");
    await save(page, "Program saved");
    doc = await getProgram();
    const second = doc.coverImage;
    if (second?.publicId) uploaded.add(second.publicId);
    check("program: replacement saved", second?.publicId && second.publicId !== first.publicId, second?.publicId);
    check("program: old Cloudinary asset deleted after replace", await assetGone(first.publicId));

    // remove: brand pattern returns, asset deleted (a successful save returns to the list, so open the form again)
    await page.goto(`${base}/admin/programs/${programId}/edit`);
    await page.getByRole("button", { name: "Remove image" }).click();
    await save(page, "Program saved");
    doc = await getProgram();
    check("program: image removed from the record", !doc.coverImage && !doc.coverImageUrl);
    check("program: Cloudinary asset deleted after remove", await assetGone(second.publicId));
    pub = await publicCover(page, "/programs", programSlug);
    check("program: card shows the brand pattern, no image", pub.cardFound && !pub.cardImg);
    check("program: detail page shows the brand pattern", (await page.locator("main .program-pattern").count()) > 0 && !pub.imgs.some((i) => mentions(i.src, "res.cloudinary.com")));
    check("program 1440: no horizontal scroll", await noHScroll(page));
    await context.close();
  }

  // ======== Course, 360px, keyboard only, reduced motion
  {
    const { context, page } = await session({ width: 360, height: 780 }, "reduce");
    await page.goto(`${base}/admin/courses/${courseId}/edit`, { waitUntil: "load" });
    await page.waitForTimeout(2000); // let the form hydrate before keyboard input
    const zoneButton = page.getByRole("button", { name: /Choose an image/ });
    await zoneButton.waitFor();
    check("course 360: no horizontal scroll on the edit page", await noHScroll(page));

    // keyboard: focus the zone button with Tab, open the file chooser with Enter
    await page.locator("#field-cover-label").scrollIntoViewIfNeeded();
    let reached = false;
    for (let i = 0; i < 80 && !reached; i++) {
      await page.keyboard.press("Tab");
      reached = await zoneButton.evaluate((el) => el === document.activeElement);
    }
    check("course 360: the uploader is reachable with Tab", reached);
    const outline = await zoneButton.evaluate((el) => getComputedStyle(el).outlineStyle);
    check("course 360: focused uploader shows a focus outline", outline !== "none", outline);
    const [chooser] = await Promise.all([page.waitForEvent("filechooser", { timeout: 5000 }), page.keyboard.press("Enter")]);
    check("course 360: Enter on the uploader opens the file chooser", Boolean(chooser));

    // reduced motion: no transition or animation on the progress bar
    const sawBar = page.getByRole("progressbar").waitFor({ timeout: 10000 }).then(
      async () => page.evaluate(() => {
        const bar = document.querySelector('[role="progressbar"] > div');
        if (!bar) return "gone";
        const s = getComputedStyle(bar);
        return `${s.transitionDuration}|${s.animationName}`;
      }),
      () => "not seen",
    );
    await chooser.setFiles(jpg);
    const motion = await sawBar;
    check("course 360: progress bar has no motion with reduced motion on", // the global reduced-motion rule shortens durations to 0.01ms rather than 0, so accept anything that small
      motion === "not seen" || motion === "gone" || (motion.split("|")[1] === "none" && motion.split("|")[0].split(",").every((d) => parseFloat(d) <= 0.01)),
      motion,
    );
    await altInput(page).waitFor({ state: "visible", timeout: 60000 });

    // keyboard: Tab to the alt field and type
    reached = false;
    for (let i = 0; i < 20 && !reached; i++) {
      reached = await altInput(page).evaluate((el) => el === document.activeElement);
      if (!reached) await page.keyboard.press("Tab");
    }
    check("course 360: alt field reachable with Tab", reached);
    await page.keyboard.type("Course test cover");
    await page.screenshot({ path: `${shots}/course-360-uploaded.png`, fullPage: true });
    check("course 360: no horizontal scroll with an image chosen", await noHScroll(page));

    // save with the keyboard: focus the submit button and press Enter
    await page.getByRole("button", { name: "Save changes" }).focus();
    await page.keyboard.press("Enter");
    await page.getByText("Course saved").first().waitFor({ timeout: 30000 });
    let doc = await getCourse();
    const img = doc.coverImage;
    if (img?.publicId) uploaded.add(img.publicId);
    check("course: saved image in tareeq/course with alt", Boolean(img?.publicId?.startsWith("tareeq/course") && img.alt === "Course test cover"), img?.publicId);

    const pub = await publicCover(page, "/courses", courseSlug);
    check("course: card shows the uploaded image", pub.cardFound && mentions(pub.cardImg, img.publicId), pub.cardFound ? pub.cardImg : "card not found");
    check("course: detail page shows the uploaded image and it loads", pub.imgs.some((i) => mentions(i.src, img.publicId) && i.ok));
    check("course 360: no horizontal scroll on the public detail page", await noHScroll(page));
    await page.screenshot({ path: `${shots}/course-360-public.png`, fullPage: false });

    // keyboard: remove the image, focus returns to the zone
    await page.goto(`${base}/admin/courses/${courseId}/edit`);
    const removeButton = page.getByRole("button", { name: "Remove image" });
    await removeButton.focus();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(200);
    const focusBack = await page.getByRole("button", { name: /Choose an image/ }).evaluate((el) => el === document.activeElement);
    check("course 360: after Remove, focus returns to the uploader", focusBack);
    await page.getByRole("button", { name: "Save changes" }).focus();
    await page.keyboard.press("Enter");
    await page.getByText("Course saved").first().waitFor({ timeout: 30000 });
    doc = await getCourse();
    check("course: image removed from the record", !doc.coverImage);
    check("course: Cloudinary asset deleted after remove", await assetGone(img.publicId));
    await context.close();
  }

  // ======== Program, 360px: wrong type and missing alt text, as they look on a phone
  {
    const { context, page } = await session({ width: 360, height: 780 }, "reduce");
    await page.goto(`${base}/admin/programs/${programId}/edit`);
    await page.getByRole("button", { name: /Choose an image/ }).waitFor();
    await fileInput(page).setInputFiles(gif);
    check("program 360: GIF rejected with the type message", (await zone(page).textContent())?.trim() === MSG.type);
    await page.screenshot({ path: `${shots}/program-360-type-error.png`, fullPage: false, clip: undefined });
    await page.getByRole("button", { name: "Dismiss" }).click();
    await upload(page, jpg);
    await save(page);
    await page.getByText(MSG.alt).first().waitFor({ timeout: 10000 });
    check("program 360: save without alt text is blocked", (await altInput(page).getAttribute("aria-invalid")) === "true");
    check("program 360: no horizontal scroll with errors shown", await noHScroll(page));
    await page.screenshot({ path: `${shots}/program-360-alt-error.png`, fullPage: true });
    // the upload above was never saved: an orphan in Cloudinary; find and delete it at cleanup
    await context.close();
  }
} catch (err) {
  check("script ran to the end", false, err?.message?.split("\n").slice(0, 12).join(" / "));
  for (const ctx of browser.contexts()) for (const p of ctx.pages()) await p.screenshot({ path: `${shots}/failure.png`, fullPage: true }).catch(() => {});
} finally {
  await browser.close();
  // cleanup: test records, then every asset this run uploaded (including unsaved ones in tareeq/program and tareeq/course)
  await db.collection("programs").deleteOne({ _id: programId });
  await db.collection("courses").deleteOne({ _id: courseId });
  const startedAt = now.getTime() - 5_000; // only assets created during this run
  for (const prefix of ["tareeq/program", "tareeq/course"]) {
    try {
      const res = await cloudinary.api.resources({ type: "upload", resource_type: "image", prefix, max_results: 100 });
      for (const r of res.resources) if (new Date(r.created_at).getTime() >= startedAt) uploaded.add(r.public_id);
    } catch (e) {
      console.log(`could not list ${prefix}: ${e?.error?.message ?? e.message}`);
    }
  }
  let left = 0;
  for (const id of uploaded) {
    try {
      await cloudinary.uploader.destroy(id, { resource_type: "image", invalidate: true });
    } catch {
      left++;
    }
  }
  console.log(`\ncleanup: deleted test program and course; destroyed ${uploaded.size - left} of ${uploaded.size} test assets`);
  await mongoose.disconnect();
  const failed = results.filter((r) => r.startsWith("FAIL")).length;
  console.log(`\n${results.length - failed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}
