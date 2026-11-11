// End-to-end checks for the lead forms (feature 006): happy paths, rejections, value preservation with
// JavaScript on and off, focus, and screenshots at 390x844 and 1440x900.
// Usage: CHROME=<path to chrome.exe> BASE=http://localhost:3000 [ONLY=workshop-errors,...] node scripts/leads-check.mjs
// Every successful submission sends a real notification email; the script keeps them to a minimum.
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const base = process.env.BASE ?? "http://localhost:3000";
const only = process.env.ONLY ? new Set(process.env.ONLY.split(",")) : null;
const run = (name) => !only || only.has(name);
const shots = "shots/006";
mkdirSync(shots, { recursive: true });

const b = await chromium.launch({ executablePath: process.env.CHROME });
const results = [];
const refs = [];
const check = (name, ok, extra = "") => results.push(`${ok ? "PASS" : "FAIL"}  ${name}${extra ? "  (" + extra + ")" : ""}`);

const MSG = {
  consent: "Please tick the box so we can contact you about your request.",
  phone: "Please enter a valid phone number, for example 0300 1234567 or +44 7700 900123.",
  email: "Please enter a valid email address, for example name@example.com.",
  fullName: "Please enter your full name.",
  participants: "Please enter a whole number between 1 and 1000.",
};

const WORKSHOP = {
  role: "teacher",
  fullName: "QA Test Lead",
  phone: "0300 1234567",
  email: "qa-006@example.com",
  organization: "QA Test School",
  participants: "25",
  message: "Automated test submission for feature 006. Please ignore.",
};

// a fresh address range per run (198.18.x.x is reserved for testing), so repeated runs never share a count
const runRange = 1 + Math.floor(Math.random() * 250);
let nextAddress = 10;
/** A fresh browser session. Each gets its own made-up address (the rate limit counts per address). */
async function newPage(w, h, js = true, addr = `198.18.${runRange}.${nextAddress++}`) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, javaScriptEnabled: js, extraHTTPHeaders: { "x-forwarded-for": addr } });
  const p = await ctx.newPage();
  const logs = [];
  p.on("console", (m) => {
    if (["error", "warning"].includes(m.type())) logs.push(m.text());
  });
  p.on("pageerror", (e) => logs.push(e.message));
  return { ctx, p, logs };
}

async function fillWorkshop(p, data, { consent = true, stop = false, email = true } = {}) {
  await p.locator(`input[name="role"][value="${data.role}"]`).check();
  for (const k of ["fullName", "phone"]) await p.fill(`#field-${k}`, data[k]);
  if (email && data.email) await p.fill("#field-email", data.email);
  if (stop) return p.inputValue("#field-preferredMonth"); // the caller presses Next itself
  const next = p.locator("button.step-next");
  if (await next.isVisible()) await next.click(); // with JavaScript: on to step 2
  for (const k of ["organization", "participants"]) await p.fill(`#field-${k}`, data[k]);
  await p.selectOption("#field-preferredMonth", { index: 2 });
  await p.fill("#field-message", data.message);
  if (consent) await p.check("#field-consent");
  return p.inputValue("#field-preferredMonth");
}

async function valuesOf(p) {
  const out = {};
  for (const k of ["fullName", "phone", "email", "organization", "participants", "message", "preferredMonth"])
    out[k] = await p.inputValue(`#field-${k}`);
  out.role = await p.locator('input[name="role"]:checked').getAttribute("value").catch(() => null);
  out.consent = await p.isChecked("#field-consent");
  return out;
}

async function submit(p) {
  await p.click('button[type="submit"]');
}

/** True when focus is on a field that has a problem (or on a radio inside a group that has one). */
const onProblemField = (p) =>
  p.evaluate(() => {
    const a = document.activeElement;
    return a?.getAttribute("aria-invalid") === "true" || !!a?.closest('fieldset[aria-invalid="true"]');
  });

/** Loads a page and waits for the brand preloader to finish (it plays on load and covers the page). */
async function open(p, path, js = true) {
  await p.goto(`${base}${path}`, { waitUntil: "load" });
  // best effort: link prefetches on an earlier page can hold the network busy without blocking anything
  if (js) await p.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
  if (js) await p.waitForFunction(() => document.documentElement.getAttribute("data-preloader") !== "run", null, { timeout: 20000 });
}

/** Screenshot from the top, after entrance and reveal animations have settled. A scrolling dialog is captured whole. */
async function shot(p, file) {
  const dialogHeight = await p.evaluate(() => {
    const d = document.querySelector('[role="dialog"]');
    const visible = d && d.offsetParent !== null;
    return visible ? Math.ceil(d.closest(".fixed").scrollHeight) : 0;
  });
  if (dialogHeight) {
    const size = p.viewportSize();
    await p.setViewportSize({ width: size.width, height: Math.max(size.height, dialogHeight) });
    await p.waitForTimeout(300);
    await p.screenshot({ path: file });
    await p.setViewportSize(size);
    return;
  }
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await p.waitForTimeout(900);
  await p.screenshot({ path: file, fullPage: true });
}

const noHScroll = (p) => p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

// ---------- Workshop: rejections with JavaScript on (client checks, same rules as server) ----------
if (run("workshop-errors")) {
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const { ctx, p, logs } = await newPage(w, h);
    const tag = `[${w}px JS on] /workshop?book=1`;
    await open(p, "/workshop?book=1");
    check(`${tag} exactly one h1`, (await p.locator("h1").count()) === 1);
    check(`${tag} no horizontal scroll`, await noHScroll(p));
    await shot(p, `${shots}/workshop-form-${w}.png`);
    // feature 013's How it works styles once hid this text on desktop and clipped it to a 3px bar on phones
    const stepText = await p.locator(".step-progress").evaluate((e) => ({ h: e.getBoundingClientRect().height, v: getComputedStyle(e).visibility }));
    check(`${tag} "Step 1 of 2" can be seen`, stepText.h >= 16 && stepText.v === "visible", JSON.stringify(stepText));

    // Step 1 problems stop "Next"; step 2 problems stop "Send"
    const cases = [
      ["consent unticked", {}, { consent: false }, "consent", 2],
      ["invalid phone", { phone: "12345" }, { stop: true }, "phone", 1],
      ["invalid email", { email: "name@" }, { stop: true }, "email", 1],
      ["missing name", { fullName: "" }, { stop: true }, "fullName", 1],
      ["participants 0", { participants: "0" }, {}, "participants", 2],
    ];
    for (const [name, patch, opts, field, step] of cases) {
      await open(p, "/workshop?book=1");
      const month = await fillWorkshop(p, { ...WORKSHOP, ...patch }, opts);
      const before = await valuesOf(p);
      if (step === 1) await p.click("button.step-next");
      else await submit(p);
      await p.waitForTimeout(300);
      const summary = p.locator('[role="alert"]', { hasText: "Please fix the following" });
      check(`${tag} ${name}: summary shown`, (await summary.count()) === 1);
      check(`${tag} ${name}: exact message`, (await summary.innerText()).includes(MSG[field]));
      check(`${tag} ${name}: message under the field`, (await p.locator(`#field-${field}-error`).innerText().catch(() => "")) === MSG[field]);
      check(`${tag} ${name}: focus on the first problem field`, await onProblemField(p));
      check(`${tag} ${name}: stays on step ${step}`, (await p.locator(".step-progress").innerText()).includes(`Step ${step} of 2`));
      const after = await valuesOf(p);
      check(`${tag} ${name}: every value kept`, JSON.stringify(after) === JSON.stringify(before) && after.preferredMonth === month);
      if (name === "invalid phone") await shot(p, `${shots}/workshop-error-${w}.png`);
    }

    // Fixing a field and leaving it clears its error
    await p.fill("#field-participants", "30");
    await p.locator("#field-message").focus();
    await p.waitForTimeout(150);
    check(`${tag} fixed field clears its error on blur`, (await p.locator("#field-participants-error").count()) === 0);

    check(`${tag} no console errors`, logs.length === 0, logs.slice(0, 2).join(" | "));
    await ctx.close();
  }
}

// ---------- Workshop: rejections with JavaScript off (server validation, values put back by the server) ----------
if (run("workshop-nojs")) {
  const { ctx, p } = await newPage(390, 844, false);
  const tag = "[390px JS off] /workshop?book=1";
  for (const [name, patch, opts, field] of [
    ["consent unticked", {}, { consent: false }, "consent"],
    ["invalid phone", { phone: "12345" }, {}, "phone"],
  ]) {
    await open(p, "/workshop?book=1", false);
    await fillWorkshop(p, { ...WORKSHOP, ...patch }, opts);
    const before = await valuesOf(p);
    await Promise.all([p.waitForLoadState("load"), submit(p)]);
    await p.waitForSelector(`#field-${field}-error`, { timeout: 20000 }).catch(() => {});
    check(`${tag} ${name}: server message shown`, (await p.locator(`#field-${field}-error`).innerText().catch(() => "")) === MSG[field]);
    const after = await valuesOf(p);
    check(`${tag} ${name}: every value kept`, JSON.stringify(after) === JSON.stringify(before), JSON.stringify(after) === JSON.stringify(before) ? "" : "values changed");
    check(`${tag} ${name}: URL carries no form data`, new URL(p.url()).search === (tag.includes("/workshop") ? "?book=1" : ""));
  }
  await ctx.close();
}

// ---------- Workshop: happy path (sends real emails) ----------
async function workshopHappy(w, h, js) {
  const { ctx, p, logs } = await newPage(w, h, js);
  const tag = `[${w}px JS ${js ? "on" : "off"}] /workshop?book=1`;
  await open(p, "/workshop?book=1", js);
  await fillWorkshop(p, WORKSHOP);
  const started = Date.now();
  await submit(p);
  const heading = p.locator("h2", { hasText: "Your request is in" });
  await heading.waitFor({ timeout: 30000 }).catch(() => {});
  const elapsed = Date.now() - started;
  check(`${tag} confirmation shown`, (await heading.count()) === 1, `${elapsed} ms`);
  const body = await p.locator("main").innerText();
  check(`${tag} states the next step`, body.includes("We'll call or WhatsApp you within 1 working day to agree a date and format."));
  const ref = (body.match(/TQ-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}/) ?? [])[0];
  check(`${tag} shows a reference`, Boolean(ref), ref);
  if (ref) refs.push(ref);
  if (js) check(`${tag} focus on confirmation heading`, await heading.evaluate((el) => el === document.activeElement));
  const wa = p.locator('a[href^="https://wa.me/"]', { hasText: "Message us on WhatsApp" });
  if ((await wa.count()) > 0) {
    const text = new URL(await wa.getAttribute("href")).searchParams.get("text") ?? "";
    check(`${tag} WhatsApp text has the type and reference`, text.includes("workshop request") && Boolean(ref) && text.includes(ref));
    check(
      `${tag} WhatsApp text has no personal data`,
      ![WORKSHOP.fullName, WORKSHOP.email, "3001234567", WORKSHOP.organization].some((s) => text.includes(s)),
    );
    check(`${tag} WhatsApp opens in a new tab`, (await wa.getAttribute("target")) === "_blank");
  } else check(`${tag} WhatsApp button present`, false, "no WhatsApp number in Settings or env?");
  check(`${tag} URL carries no form data`, new URL(p.url()).search === (tag.includes("/workshop") ? "?book=1" : ""));
  check(`${tag} no horizontal scroll`, await noHScroll(p));
  await shot(p, `${shots}/workshop-confirmation-${w}${js ? "" : "-nojs"}.png`);
  if (js) check(`${tag} no console errors`, logs.length === 0, logs.slice(0, 2).join(" | "));
  await ctx.close();
}

if (run("workshop-happy")) {
  await workshopHappy(390, 844, true);
  await workshopHappy(1440, 900, true);
}
if (run("workshop-happy-nojs")) await workshopHappy(390, 844, false);

// ---------- Workshop page and booking dialog (amendments A1-A6) ----------
if (run("dialog")) {
  for (const [w, h] of [[360, 740], [390, 844], [1440, 900]]) {
    const { ctx, p, logs } = await newPage(w, h);
    const tag = `[${w}px] /workshop dialog`;
    const dialog = p.locator('[role="dialog"]');
    const inDialog = () => p.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'));
    const scrollLocked = () => p.evaluate(() => getComputedStyle(document.body).overflow === "hidden");

    // /workshop on its own: minimal page, dialog closed
    await open(p, "/workshop");
    check(`${tag} plain /workshop: one h1`, (await p.locator("h1").count()) === 1);
    check(`${tag} plain /workshop: dialog closed`, !(await dialog.isVisible()));
    check(`${tag} plain /workshop: Book a workshop button links to ?book=1`, (await p.locator("#book-workshop-trigger").getAttribute("href")) === "/workshop?book=1");
    await shot(p, `${shots}/workshop-page-${w}.png`);

    // Opened by the page's own button
    await p.click("#book-workshop-trigger");
    await dialog.waitFor({ state: "visible" });
    check(`${tag} button opens the dialog and adds ?book=1`, p.url().endsWith("/workshop?book=1"));
    check(`${tag} dialog has an accessible name`, (await dialog.getAttribute("aria-labelledby")) === "booking-dialog-title" && (await dialog.getAttribute("aria-modal")) === "true");
    check(`${tag} focus moves inside`, await inDialog());
    check(`${tag} page behind is scroll-locked`, await scrollLocked());
    check(`${tag} no horizontal scroll`, await noHScroll(p));
    check(`${tag} city shown as read-only text, not an input`, (await dialog.textContent()).includes("Karachi") && (await dialog.locator('[name="city"]').count()) === 0);
    check(`${tag} only School and Teacher roles`, (await dialog.locator('input[name="role"]').count()) === 2);

    // Focus trap: tab past the last control and back
    let stayed = true;
    for (let i = 0; i < 40; i++) {
      await p.keyboard.press("Tab");
      if (!(await inDialog())) stayed = false;
    }
    for (let i = 0; i < 40; i++) {
      await p.keyboard.press("Shift+Tab");
      if (!(await inDialog())) stayed = false;
    }
    check(`${tag} Tab and Shift+Tab stay inside the dialog`, stayed);

    // Esc closes, removes ?book, returns focus to the trigger
    await p.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    check(`${tag} Esc closes the dialog`, !(await dialog.isVisible()));
    check(`${tag} closing removes the query parameter`, p.url().endsWith("/workshop") && !p.url().includes("?"));
    check(`${tag} focus returns to the trigger`, await p.evaluate(() => document.activeElement?.id === "book-workshop-trigger"));
    check(`${tag} scroll lock released`, !(await scrollLocked()));

    // Close button
    await p.click("#book-workshop-trigger");
    await dialog.waitFor({ state: "visible" });
    await dialog.getByRole("link", { name: "Close" }).click();
    await dialog.waitFor({ state: "hidden" });
    check(`${tag} close button closes it and removes ?book`, !p.url().includes("?"));
    check(`${tag} focus returns to the trigger after the close button`, await p.evaluate(() => document.activeElement?.id === "book-workshop-trigger"));

    // Scrim click closes (desktop only; on a phone the dialog fills the screen)
    if (w >= 640) {
      await p.click("#book-workshop-trigger");
      await dialog.waitFor({ state: "visible" });
      await p.mouse.click(8, 8);
      await dialog.waitFor({ state: "hidden" });
      check(`${tag} clicking outside closes it`, !p.url().includes("?"));
    }

    // Opened on load from another page's link (?book=1 straight in the address)
    await open(p, "/workshop?book=1");
    check(`${tag} ?book=1 on load: dialog open with focus inside`, (await dialog.isVisible()) && (await inDialog()));
    await shot(p, `${shots}/workshop-dialog-${w}.png`);
    await p.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    check(`${tag} ?book=1 on load: focus returns to the page button after Esc`, await p.evaluate(() => document.activeElement?.id === "book-workshop-trigger"));

    check(`${tag} no console errors`, logs.length === 0, logs.slice(0, 2).join(" | "));
    await ctx.close();
  }

  // Without JavaScript: the form is there and the close control is a plain link
  const { ctx, p } = await newPage(390, 844, false);
  const tag = "[390px JS off] /workshop dialog";
  await open(p, "/workshop?book=1", false);
  check(`${tag} form visible with ?book=1`, await p.locator('[role="dialog"] form').isVisible());
  check(`${tag} close control is a link to /workshop`, (await p.locator('[role="dialog"] a[aria-label="Close"]').getAttribute("href")) === "/workshop");
  const gone = await p.goto(`${base}/book-a-workshop`);
  check(`${tag} the old /book-a-workshop route is gone (404)`, gone?.status() === 404);
  await ctx.close();
}

// ---------- Entry points (US4) ----------
if (run("entry")) {
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const { ctx, p, logs } = await newPage(w, h);
    const tag = `[${w}px] entry`;
    const dialog = p.locator('[role="dialog"][aria-labelledby="booking-dialog-title"]');
    const landsOnDialog = async (name) => {
      await dialog.waitFor({ state: "visible", timeout: 15000 }).catch(() => {});
      check(`${tag} ${name} lands on /workshop with the dialog open`, new URL(p.url()).pathname === "/workshop" && new URL(p.url()).search === "?book=1" && (await dialog.isVisible()));
    };

    await open(p, "/");
    await p.locator('a:has-text("Explore programs")').first().click();
    await landsOnDialog("hero Explore programs");

    await open(p, "/");
    if (w >= 640) {
      await p.locator('header a:has-text("Book a workshop")').first().click();
      await landsOnDialog("header Book a workshop");
    } else {
      await p.click('button[aria-label="Open menu"]');
      await p.locator('[role="dialog"][aria-label="Main menu"] a:has-text("Book a workshop")').click();
      await landsOnDialog("mobile menu Book a workshop");
    }

    await open(p, "/");
    await p.locator('section[aria-label="Next step"] a').first().click();
    await landsOnDialog("home final call to action");

    await open(p, "/programs");
    const joins = p.locator('main a:has-text("Book a workshop")');
    const n = await joins.count();
    check(`${tag} Programs page has Book a workshop buttons`, n >= 1, `${n}`);
    for (let i = 0; i < n; i++) {
      await open(p, "/programs");
      await p.locator('main a:has-text("Book a workshop")').nth(i).click();
      await landsOnDialog(`Programs page button ${i + 1}`);
    }

    // /register: footer and Courses, never the header
    for (const path of ["/", "/courses", "/programs"]) {
      await open(p, path);
      check(`${tag} footer links to /register on ${path}`, (await p.locator('footer a[href="/register"]').count()) === 1);
    }
    await open(p, "/courses");
    check(`${tag} Courses page links to /register`, (await p.locator('main a[href="/register"]').count()) >= 1);
    check(`${tag} the header has no link to /register`, (await p.locator('header a[href="/register"]').count()) === 0);
    if (w < 640) {
      await p.click('button[aria-label="Open menu"]');
      await p.waitForTimeout(500);
      check(`${tag} the mobile menu has no link to /register`, (await p.locator('[role="dialog"][aria-label="Main menu"] a[href="/register"]').count()) === 0);
    }
    check(`${tag} no console errors`, logs.length === 0, logs.slice(0, 2).join(" | "));
    await ctx.close();
  }
}

// ---------- Course waitlist (/register) ----------
const COURSE = {
  fullName: "QA Test Learner",
  phone: "+44 7700 900123",
  email: "qa-006-course@example.com",
  courseId: "not-sure",
  level: "beginner",
  ageGroup: "18-plus",
  message: "Automated test submission for feature 006. Please ignore.",
};
const GUARDIAN = "Please have a parent or guardian submit this form.";

async function fillCourse(p, data, { consent = true } = {}) {
  for (const k of ["fullName", "phone", "email"]) await p.fill(`#field-${k}`, data[k]);
  await p.selectOption("#field-courseId", data.courseId);
  await p.locator(`input[name="level"][value="${data.level}"]`).check();
  await p.locator(`input[name="ageGroup"][value="${data.ageGroup}"]`).check();
  await p.fill("#field-message", data.message);
  if (consent) await p.check("#field-consent");
}

async function courseValues(p) {
  const out = {};
  for (const k of ["fullName", "phone", "email", "courseId", "message"]) out[k] = await p.inputValue(`#field-${k}`);
  for (const k of ["level", "ageGroup"]) out[k] = await p.locator(`input[name="${k}"]:checked`).getAttribute("value").catch(() => null);
  out.consent = await p.isChecked("#field-consent");
  return out;
}

if (run("register-errors")) {
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    const { ctx, p, logs } = await newPage(w, h);
    const tag = `[${w}px JS on] /register`;
    await open(p, "/register");
    check(`${tag} h1 reads "Join the waitlist"`, (await p.locator("h1").innerText()).trim() === "Join the waitlist");
    check(`${tag} button reads "Join the waitlist"`, (await p.locator('button[type="submit"]').innerText()).trim() === "Join the waitlist");
    const opts = await p.locator("#field-courseId option").allInnerTexts();
    check(`${tag} course list ends with "Not sure yet"`, opts.at(-1) === "Not sure yet" && opts.length >= 3, opts.join(" / "));
    check(`${tag} no horizontal scroll`, await noHScroll(p));
    await shot(p, `${shots}/register-form-${w}.png`);

    // under-18 note appears, is announced (live region), and goes away again
    const note = p.locator("#guardian-note");
    check(`${tag} guardian note hidden at first`, (await note.innerText()).trim() === "");
    check(`${tag} guardian note is a live region`, (await note.getAttribute("aria-live")) === "polite");
    await p.locator('input[name="ageGroup"][value="under-18"]').check();
    check(`${tag} guardian note shown for under 18`, (await note.innerText()).trim() === GUARDIAN);
    await p.locator('input[name="ageGroup"][value="18-plus"]').check();
    check(`${tag} guardian note hidden again for 18 or over`, (await note.innerText()).trim() === "");

    for (const [name, patch, opts2, field] of [
      ["consent unticked", {}, { consent: false }, "consent"],
      ["invalid phone", { phone: "12345" }, {}, "phone"],
    ]) {
      await open(p, "/register");
      await fillCourse(p, { ...COURSE, ...patch }, opts2);
      const before = await courseValues(p);
      await submit(p);
      await p.waitForTimeout(300);
      const summary = p.locator('[role="alert"]', { hasText: "Please fix the following" });
      check(`${tag} ${name}: exact message`, (await p.locator(`#field-${field}-error`).innerText().catch(() => "")) === MSG[field]);
      check(`${tag} ${name}: focus on the first problem field`, await onProblemField(p));
      check(`${tag} ${name}: every value kept`, JSON.stringify(await courseValues(p)) === JSON.stringify(before));
      if (name === "invalid phone") await shot(p, `${shots}/register-error-${w}.png`);
    }
    check(`${tag} no console errors`, logs.length === 0, logs.slice(0, 2).join(" | "));
    await ctx.close();
  }
}

if (run("register-nojs")) {
  const { ctx, p } = await newPage(390, 844, false);
  const tag = "[390px JS off] /register";
  await open(p, "/register", false);
  check(`${tag} guardian note shown as static guidance`, (await p.locator("main").innerText()).toLowerCase().includes(GUARDIAN.toLowerCase()));
  await fillCourse(p, { ...COURSE, phone: "12345", ageGroup: "under-18" });
  const before = await courseValues(p);
  await Promise.all([p.waitForLoadState("load"), submit(p)]);
  await p.waitForSelector("#field-phone-error", { timeout: 20000 }).catch(() => {});
  check(`${tag} invalid phone: server message shown`, (await p.locator("#field-phone-error").innerText().catch(() => "")) === MSG.phone);
  check(`${tag} invalid phone: every value kept`, JSON.stringify(await courseValues(p)) === JSON.stringify(before));
  check(`${tag} URL carries no form data`, new URL(p.url()).search === (tag.includes("/workshop") ? "?book=1" : ""));

  // A course id that is not in the list (tampered request) is refused by the server
  await open(p, "/register", false);
  await fillCourse(p, COURSE);
  await p.evaluate(() => {
    const o = document.querySelector('#field-courseId option[value="not-sure"]');
    o.value = "made-up-course";
  });
  await Promise.all([p.waitForLoadState("load"), submit(p)]);
  await p.waitForSelector("#field-courseId-error", { timeout: 20000 }).catch(() => {});
  check(`${tag} unknown course refused by the server`, (await p.locator("#field-courseId-error").innerText().catch(() => "")) === "Please choose a course, or pick ‘Not sure yet’.");
  await ctx.close();
}

async function courseHappy(w, h) {
  const { ctx, p, logs } = await newPage(w, h);
  const tag = `[${w}px JS on] /register`;
  await open(p, "/register");
  await fillCourse(p, { ...COURSE, courseId: w === 390 ? "not-sure" : "ai-for-teachers" });
  await submit(p);
  const heading = p.locator("h2", { hasText: "You’re on the waitlist" });
  await heading.waitFor({ timeout: 30000 }).catch(() => {});
  check(`${tag} confirmation shown`, (await heading.count()) === 1);
  const body = await p.locator("main").innerText();
  check(`${tag} states the next step`, body.includes("We'll WhatsApp you when this course opens for enrolment, with dates and fees."));
  const ref = (body.match(/TQ-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}/) ?? [])[0];
  check(`${tag} shows a reference`, Boolean(ref), ref);
  if (ref) refs.push(ref);
  check(`${tag} focus on confirmation heading`, await heading.evaluate((el) => el === document.activeElement));
  const wa = p.locator('a[href^="https://wa.me/"]', { hasText: "Message us on WhatsApp" });
  const text = (await wa.count()) ? new URL(await wa.getAttribute("href")).searchParams.get("text") ?? "" : "";
  check(`${tag} WhatsApp text has the type and reference`, text.includes("waitlist") && Boolean(ref) && text.includes(ref));
  check(`${tag} WhatsApp text has no personal data`, ![COURSE.fullName, COURSE.email, "7700900123", "7700 900123"].some((s) => text.includes(s)));
  check(`${tag} nothing implies a place is held`, !/place is (held|reserved)|you're booked|enrolled/i.test(body));
  await shot(p, `${shots}/register-confirmation-${w}.png`);
  check(`${tag} no console errors`, logs.length === 0, logs.slice(0, 2).join(" | "));
  await ctx.close();
}

if (run("register-happy")) {
  await courseHappy(390, 844);
  await courseHappy(1440, 900);
}

// ---------- Workshop: keyboard only (sends a real email) ----------
if (run("workshop-keyboard")) {
  const { ctx, p } = await newPage(390, 844);
  const tag = "[390px keyboard] /workshop?book=1";
  await open(p, "/workshop?book=1");
  const active = () =>
    p.evaluate(
      () =>
        document.activeElement?.getAttribute("name") ??
        document.activeElement?.className?.split(" ").find((c) => c.startsWith("step-")) ??
        document.activeElement?.tagName,
    );
  let guard = 0;
  while ((await active()) !== "role" && guard++ < 40) await p.keyboard.press("Tab");
  check(`${tag} Tab reaches the first field`, (await active()) === "role");
  await p.keyboard.press("ArrowRight"); // School -> Teacher (two roles)
  const typed = { ...WORKSHOP, fullName: "QA Keyboard Lead" };
  let orderOk = true;
  for (const name of ["fullName", "phone", "email"]) {
    await p.keyboard.press("Tab");
    if ((await active()) !== name) orderOk = false;
    await p.keyboard.type(typed[name]);
  }
  await p.keyboard.press("Tab");
  check(`${tag} step 1: Tab reaches Next after the fields`, (await active()) === "step-next");
  await p.keyboard.press("Enter");
  await p.waitForTimeout(200);
  check(`${tag} Enter on Next moves to step 2 and focuses its first field`, (await active()) === "organization");
  await p.keyboard.type(typed.organization);
  for (const name of ["participants", "preferredMonth", "message", "consent"]) {
    await p.keyboard.press("Tab");
    if ((await active()) !== name) orderOk = false;
    if (name === "preferredMonth") await p.keyboard.press("ArrowDown");
    else if (name === "consent") await p.keyboard.press("Space");
    else await p.keyboard.type(typed[name]);
  }
  check(`${tag} Tab order follows the visual order`, orderOk);
  check(`${tag} focus is visible`, await p.evaluate(() => getComputedStyle(document.activeElement).outlineStyle !== "none"));
  await p.keyboard.press("Tab");
  check(`${tag} Tab reaches Back, then Send`, (await active()) === "step-back");
  await p.keyboard.press("Tab");
  check(`${tag} Tab reaches the submit button`, (await p.evaluate(() => document.activeElement?.getAttribute("type"))) === "submit");
  check(`${tag} honeypot never focused`, !(await p.evaluate(() => document.activeElement?.getAttribute("name") === "website")));
  await p.keyboard.press("Enter");
  const heading = p.locator("h2", { hasText: "Your request is in" });
  await heading.waitFor({ timeout: 30000 }).catch(() => {});
  check(`${tag} submitted with the keyboard alone`, (await heading.count()) === 1);
  const ref = ((await p.locator("main").innerText()).match(/TQ-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}/) ?? [])[0];
  if (ref) refs.push(ref);
  await ctx.close();
}

// ---------- Workshop: two steps and optional email (amendments A7, A9) ----------
if (run("workshop-steps")) {
  const { ctx, p } = await newPage(390, 844);
  const tag = "[390px] steps";
  await open(p, "/workshop?book=1");
  const emailLabel = await p.locator('label[for="field-email"]').innerText();
  check(`${tag} email is optional (marked optional, not required)`, emailLabel.includes("optional") && !emailLabel.includes("required"));
  // Next is blocked until step 1 is valid
  await p.click("button.step-next");
  check(`${tag} Next with an empty step 1 stays on step 1`, (await p.locator(".step-progress").innerText()).includes("Step 1 of 2"));
  const msgs = await p.locator('[role="alert"]', { hasText: "Please fix the following" }).innerText();
  check(
    `${tag} empty step 1 lists role, name and phone but not email`,
    msgs.includes("who the workshop is for") && msgs.includes("full name") && msgs.includes("phone number") && !msgs.includes("email address"),
  );
  // Enter in a step 1 field acts as Next, not as send
  await p.locator('input[name="role"][value="school"]').check();
  await p.fill("#field-fullName", "QA Steps");
  await p.fill("#field-phone", "03001234567");
  await p.press("#field-phone", "Enter");
  await p.waitForTimeout(200);
  check(`${tag} Enter in a step 1 field goes to step 2`, (await p.locator(".step-progress").innerText()).includes("Step 2 of 2"));
  // Back keeps everything
  await p.fill("#field-organization", "QA Back School");
  await p.fill("#field-participants", "12");
  await p.fill("#field-message", "keep me");
  await p.click("button.step-back");
  await p.waitForTimeout(200);
  check(
    `${tag} Back returns to step 1 with its values`,
    (await p.locator(".step-progress").innerText()).includes("Step 1 of 2") &&
      (await p.inputValue("#field-fullName")) === "QA Steps" &&
      (await p.inputValue("#field-phone")) === "03001234567",
  );
  await p.click("button.step-next");
  await p.waitForTimeout(200);
  check(
    `${tag} step 2 values survived going back and forth`,
    (await p.inputValue("#field-organization")) === "QA Back School" &&
      (await p.inputValue("#field-participants")) === "12" &&
      (await p.inputValue("#field-message")) === "keep me",
  );
  await ctx.close();
}

// ---------- Workshop: layout and fit (amendments A10-A13) ----------
if (run("workshop-fit")) {
  for (const [w, h] of [[1280, 720], [360, 640]]) {
    const { ctx, p } = await newPage(w, h);
    const tag = `[${w}x${h}] fit`;
    await open(p, "/workshop?book=1");
    for (const step of [1, 2]) {
      if (step === 2) {
        await fillWorkshop(p, WORKSHOP, { stop: true });
        await p.click("button.step-next");
        await p.waitForTimeout(250);
      }
      const m = await p.evaluate(() => {
        const dlg = document.querySelector('[role="dialog"]');
        const form = dlg.querySelector("form");
        const scroller = dlg.parentElement.parentElement; // the dialog overlay: the only thing that can scroll
        const footer = form.lastElementChild;
        const r = dlg.getBoundingClientRect();
        const f = footer.getBoundingClientRect();
        const controls = [...dlg.querySelectorAll("input:not([type=hidden]):not([type=radio]):not([type=checkbox]), select, textarea")].filter((e) => e.offsetParent !== null);
        const small = controls.filter((e) => parseFloat(getComputedStyle(e).fontSize) < 16).map((e) => e.name);
        const labels = [...dlg.querySelectorAll("label.block, legend")].filter((e) => e.offsetParent !== null).map((e) => parseFloat(getComputedStyle(e).fontSize));
        const top = (n) => dlg.querySelector(`[name="${n}"]`)?.getBoundingClientRect().top;
        return {
          fits: scroller.scrollHeight <= scroller.clientHeight + 1,
          overflow: scroller.scrollHeight - scroller.clientHeight,
          inViewport: r.top >= 0 && r.bottom <= window.innerHeight + 1 && r.left >= 0 && r.right <= window.innerWidth + 1,
          footerInViewport: f.bottom <= window.innerHeight + 1 && f.top >= 0,
          small,
          minLabel: Math.min(...labels),
          namePhone: top("fullName") === top("phone"),
          partMonth: top("participants") === top("preferredMonth"),
          hScroll: document.documentElement.scrollWidth > window.innerWidth,
          nestedScroll: [...dlg.querySelectorAll("*")].some(
            (e) => !["TEXTAREA", "SELECT", "OPTION"].includes(e.tagName) && ["auto", "scroll"].includes(getComputedStyle(e).overflowY),
          ),
          footerSticky: getComputedStyle(footer).position === "sticky",
          taRows: dlg.querySelector("textarea")?.getAttribute("rows"),
          monthFits: (() => {
            const sel = dlg.querySelector('select[name="preferredMonth"]');
            if (!sel || sel.offsetParent === null) return true;
            const cs = getComputedStyle(sel);
            const ctx = document.createElement("canvas").getContext("2d");
            ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
            const room = sel.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
            return Math.max(...[...sel.options].map((o) => ctx.measureText(o.text).width)) <= room;
          })(),
        };
      });
      check(`${tag} step ${step}: fits without scrolling`, m.fits, m.fits ? "" : `${m.overflow}px too tall`);
      check(`${tag} step ${step}: dialog inside the viewport`, m.inViewport);
      check(`${tag} step ${step}: buttons visible at the bottom`, m.footerInViewport);
      check(`${tag} step ${step}: input text is 16px or more`, m.small.length === 0, m.small.join(","));
      check(`${tag} step ${step}: labels are 12-14px`, m.minLabel >= 12 && m.minLabel <= 14, `${m.minLabel}px`);
      check(`${tag} step ${step}: no horizontal scroll`, !m.hScroll);
      check(`${tag} step ${step}: no scroll area inside the form`, !m.nestedScroll);
      check(`${tag} step ${step}: buttons are sticky at the bottom`, m.footerSticky);
      if (step === 1) check(`${tag} step 1: name and phone ${w >= 640 ? "share a row" : "are on separate rows"}`, w >= 640 ? m.namePhone : !m.namePhone);
      if (step === 2) {
        check(`${tag} step 2: participants and month stay paired`, m.partMonth);
        check(`${tag} step 2: message starts at 2 rows`, m.taRows === "2");
        check(`${tag} step 2: every month name fits in its dropdown`, m.monthFits);
      }
      await shot(p, `${shots}/workshop-step${step}-${w}x${h}.png`);
    }
    // the message box grows but stops at 4 rows
    await p.fill("#field-message", Array.from({ length: 12 }, (_, i) => `line ${i}`).join("\n"));
    const taH = await p.evaluate(() => document.querySelector("textarea").getBoundingClientRect().height);
    check(`${tag} message box stops growing at 4 rows`, taH <= 130 && taH >= 70, `${Math.round(taH)}px`);
    await ctx.close();
  }
}

if (run("workshop-narrow")) {
  const { ctx, p } = await newPage(320, 568);
  const tag = "[320x568] narrow";
  await open(p, "/workshop?book=1");
  await fillWorkshop(p, WORKSHOP, { stop: true });
  await p.click("button.step-next");
  await p.waitForTimeout(250);
  const m = await p.evaluate(() => {
    const dlg = document.querySelector('[role="dialog"]');
    const top = (n) => dlg.querySelector(`[name="${n}"]`).getBoundingClientRect().top;
    const overlay = dlg.parentElement.parentElement;
    return {
      wrapped: top("participants") !== top("preferredMonth"),
      hScroll: document.documentElement.scrollWidth > window.innerWidth || dlg.scrollWidth > dlg.clientWidth,
      scrolls: overlay.scrollHeight > overlay.clientHeight,
      footerVisible: dlg.querySelector("form").lastElementChild.getBoundingClientRect().bottom <= window.innerHeight + 1,
    };
  });
  check(`${tag} participants and month wrap onto their own lines`, m.wrapped);
  check(`${tag} no horizontal scroll`, !m.hScroll);
  check(`${tag} buttons still visible (the dialog scrolls as a whole if needed)`, m.footerVisible, m.scrolls ? "dialog scrolls" : "");
  await shot(p, `${shots}/workshop-step2-320x568.png`);
  await ctx.close();
}

// ---------- Workshop: no email given (sends a real email) ----------
if (run("workshop-noemail")) {
  const { ctx, p } = await newPage(390, 844);
  const tag = "[390px] no email";
  await open(p, "/workshop?book=1");
  await fillWorkshop(p, WORKSHOP, { email: false });
  await submit(p);
  const heading = p.locator("h2", { hasText: "Your request is in" });
  await heading.waitFor({ timeout: 30000 }).catch(() => {});
  check(`${tag} a request without an email is accepted`, (await heading.count()) === 1);
  const ref = ((await p.locator("main").innerText()).match(/TQ-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}/) ?? [])[0];
  if (ref) refs.push(ref);
  await ctx.close();
}

// ---------- 360px pass over both forms (constitution I): no sideways scroll, 44px touch targets ----------
if (run("pass360")) {
  const { ctx, p } = await newPage(360, 740);
  const tag = "[360px]";
  const measure = () =>
    p.evaluate(() => {
      const root = document.querySelector('[role="dialog"]') ?? document;
      const tiny = [...root.querySelectorAll("input:not([type=hidden]), select, textarea, button, a[href]")]
        .filter((e) => e.getClientRects().length > 0 && e.tabIndex >= 0 && !e.closest('[aria-hidden="true"]') && e.getAttribute("href") !== "#content") // the skip link is meant to be off-screen until focused
        .filter((e) => {
          const r = (e.type === "radio" || e.type === "checkbox" ? e.closest("label, div") : e).getBoundingClientRect();
          return r.height < 43.5 || r.width < 43.5;
        })
        .map((e) => e.name || e.getAttribute("aria-label") || e.textContent?.trim().slice(0, 20));
      return { hScroll: document.documentElement.scrollWidth > window.innerWidth, tiny };
    });
  await open(p, "/workshop?book=1");
  let m = await measure();
  check(`${tag} workshop step 1: no horizontal scroll`, !m.hScroll);
  check(`${tag} workshop step 1: every control is at least 44px`, m.tiny.length === 0, m.tiny.join(", "));
  await fillWorkshop(p, WORKSHOP, { stop: true });
  await p.click("button.step-next");
  await p.waitForTimeout(250);
  m = await measure();
  check(`${tag} workshop step 2: no horizontal scroll`, !m.hScroll);
  check(`${tag} workshop step 2: every control is at least 44px`, m.tiny.length === 0, m.tiny.join(", "));
  await open(p, "/register");
  m = await measure();
  check(`${tag} register: no horizontal scroll`, !m.hScroll);
  check(`${tag} register: every control is at least 44px`, m.tiny.length === 0, m.tiny.join(", "));
  await ctx.close();
}

// ---------- Spam protection: honeypot and rate limit (US5) ----------
// Needs the dev database: run with `node --env-file=.env.local scripts/leads-check.mjs`. Refuses any database but tareeq_dev.
if (run("spam")) {
  const { MongoClient } = await import("mongodb");
  const { deriveKey } = await import("../src/lib/leads/rate-key.ts");
  const secret = process.env.RATE_LIMIT_SECRET;
  const client = new MongoClient(process.env.MONGODB_URI ?? "", { serverSelectionTimeoutMS: 8000 });
  await client.connect();
  const d = client.db();
  if (d.databaseName !== "tareeq_dev" || !secret) throw new Error("spam checks need MONGODB_URI (tareeq_dev) and RATE_LIMIT_SECRET from .env.local");
  const addr = (n) => `203.0.113.${n}`; // documentation range: never a real visitor
  const addrs = [201, 202, 203, 204, 205, 206, 207].map(addr);
  const keyOf = (a) => deriveKey(a, secret);
  const limits = d.collection("rate_limits");
  const used = (a) => limits.countDocuments({ key: keyOf(a) });
  const seed = async (a, n) => {
    await limits.deleteMany({ key: keyOf(a) });
    if (n) await limits.insertMany(Array.from({ length: n }, () => ({ key: keyOf(a), createdAt: new Date() })));
  };
  for (const a of addrs) await seed(a, 0);
  const RATE_MSG = "You've sent several requests in a short time. Please try again in an hour, or message us on WhatsApp.";

  // Honeypot, workshop
  {
    const { ctx, p } = await newPage(390, 844, true, addr(201));
    const tag = "[390px] honeypot workshop";
    await open(p, "/workshop?book=1");
    check(`${tag} the trap field is not in the accessibility tree`, (await p.getByRole("textbox", { name: "Website" }).count()) === 0);
    const box = await p.locator('input[name="website"]').boundingBox();
    check(`${tag} the trap field is off the screen`, !box || box.x + box.width <= 0);
    await fillWorkshop(p, WORKSHOP);
    const key = await p.inputValue('input[name="submissionKey"]');
    await p.evaluate(() => (document.querySelector('input[name="website"]').value = "http://spam.example"));
    await submit(p);
    const heading = p.locator("h2", { hasText: "Your request is in" });
    await heading.waitFor({ timeout: 30000 }).catch(() => {});
    check(`${tag} a bot sees a normal success screen`, (await heading.count()) === 1);
    check(`${tag} nothing was saved`, (await d.collection("leads").countDocuments({ submissionKey: key })) === 0);
    check(`${tag} the bot still used up one of its 5`, (await used(addr(201))) === 1);
    await ctx.close();
  }
  // Honeypot, course
  {
    const { ctx, p } = await newPage(390, 844, true, addr(202));
    const tag = "[390px] honeypot course";
    await open(p, "/register");
    await fillCourse(p, COURSE);
    const key = await p.inputValue('input[name="submissionKey"]');
    await p.evaluate(() => (document.querySelector('input[name="website"]').value = "x"));
    await submit(p);
    const heading = p.locator("h2", { hasText: "You’re on the waitlist" });
    await heading.waitFor({ timeout: 30000 }).catch(() => {});
    check(`${tag} a bot sees a normal success screen`, (await heading.count()) === 1);
    check(`${tag} nothing was saved`, (await d.collection("leads").countDocuments({ submissionKey: key })) === 0);
    await ctx.close();
  }

  // Boundary: with 4 used, the 5th is accepted and the 6th is refused
  {
    await seed(addr(203), 4);
    const { ctx, p, logs } = await newPage(390, 844, true, addr(203));
    const tag = "[390px] rate limit boundary";
    await open(p, "/workshop?book=1");
    await fillWorkshop(p, WORKSHOP);
    await submit(p);
    const heading = p.locator("h2", { hasText: "Your request is in" });
    await heading.waitFor({ timeout: 30000 }).catch(() => {});
    check(`${tag} the 5th submission in the hour is accepted`, (await heading.count()) === 1);
    const ref = ((await p.locator("main").innerText()).match(/TQ-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}/) ?? [])[0];
    if (ref) refs.push(ref);
    check(`${tag} it counted as the 5th`, (await used(addr(203))) === 5);

    const p2 = await ctx.newPage();
    await open(p2, "/workshop?book=1");
    const month = await fillWorkshop(p2, { ...WORKSHOP, fullName: "QA Limit Lead" });
    const before = await valuesOf(p2);
    await submit(p2);
    const alert = p2.locator('[role="alert"]', { hasText: "several requests" });
    await alert.waitFor({ timeout: 30000 }).catch(() => {});
    check(`${tag} the 6th is refused with the friendly message`, (await alert.count()) === 1 && (await alert.innerText()).includes(RATE_MSG));
    check(`${tag} the refusal offers WhatsApp`, (await alert.locator('a[href^="https://wa.me/"]').count()) === 1);
    check(`${tag} focus is on the message`, await alert.evaluate((el) => el === document.activeElement));
    const after = await valuesOf(p2);
    check(`${tag} every value is kept`, JSON.stringify(after) === JSON.stringify(before) && after.preferredMonth === month);
    check(`${tag} the refusal did not use up another`, (await used(addr(203))) === 5);
    await shot(p2, `${shots}/workshop-ratelimit-390.png`);
    check(`${tag} no console errors`, logs.length === 0, logs.slice(0, 2).join(" | "));
    await ctx.close();
  }

  // The limit is shared: after 5 workshop requests the course form is refused too
  {
    await seed(addr(204), 5);
    const { ctx, p } = await newPage(1440, 900, true, addr(204));
    const tag = "[1440px] rate limit on the course form";
    await open(p, "/register");
    await fillCourse(p, COURSE);
    const before = await courseValues(p);
    await submit(p);
    const alert = p.locator('[role="alert"]', { hasText: "several requests" });
    await alert.waitFor({ timeout: 30000 }).catch(() => {});
    check(`${tag} refused with the friendly message`, (await alert.count()) === 1);
    check(`${tag} every value is kept`, JSON.stringify(await courseValues(p)) === JSON.stringify(before));
    await shot(p, `${shots}/register-ratelimit-1440.png`);
    await ctx.close();
  }

  // Without JavaScript
  {
    await seed(addr(205), 5);
    const { ctx, p } = await newPage(390, 844, false, addr(205));
    const tag = "[390px JS off] rate limit";
    await open(p, "/workshop?book=1", false);
    await fillWorkshop(p, WORKSHOP);
    const before = await valuesOf(p);
    await Promise.all([p.waitForLoadState("load"), submit(p)]);
    await p.waitForSelector('[role="alert"]', { timeout: 20000 }).catch(() => {});
    check(`${tag} refused with the friendly message`, (await p.locator("main").innerText()).includes("several requests in a short time"));
    check(`${tag} every value is kept`, JSON.stringify(await valuesOf(p)) === JSON.stringify(before));
    await ctx.close();
  }

  // Mistakes never use up one of the 5, and are reported even to someone who is over the limit
  {
    await seed(addr(206), 5);
    const { ctx, p } = await newPage(390, 844, false, addr(206));
    const tag = "[390px JS off] mistakes and the limit";
    await open(p, "/workshop?book=1", false);
    await fillWorkshop(p, { ...WORKSHOP, phone: "12345" });
    await Promise.all([p.waitForLoadState("load"), submit(p)]);
    await p.waitForSelector("#field-phone-error", { timeout: 20000 }).catch(() => {});
    check(`${tag} over the limit, a mistake still gets its own message`, (await p.locator("#field-phone-error").innerText().catch(() => "")) === MSG.phone);
    await ctx.close();

    await seed(addr(207), 0);
    const second = await newPage(390, 844, false, addr(207));
    for (let i = 0; i < 3; i++) {
      await open(second.p, "/workshop?book=1", false);
      await fillWorkshop(second.p, { ...WORKSHOP, phone: "12345" });
      await Promise.all([second.p.waitForLoadState("load"), submit(second.p)]);
      await second.p.waitForSelector("#field-phone-error", { timeout: 20000 }).catch(() => {});
    }
    check(`${tag} three rejected mistakes used up none of the 5`, (await used(addr(207))) === 0);
    await second.ctx.close();
  }

  for (const a of addrs) await seed(a, 0);
  await client.close();
}

// ---------- Workshop: database unreachable (run against a server whose MONGODB_URI points nowhere) ----------
if (run("workshop-outage")) {
  for (const js of [true, false]) {
    const { ctx, p } = await newPage(390, 844, js);
    const tag = `[390px JS ${js ? "on" : "off"}] /workshop?book=1 outage`;
    await open(p, "/workshop?book=1", js);
    await fillWorkshop(p, WORKSHOP);
    const before = await valuesOf(p);
    const started = Date.now();
    await submit(p);
    const alert = p.locator('[role="alert"]', { hasText: "Something went wrong on our side" });
    await alert.waitFor({ timeout: 30000 }).catch(() => {});
    check(`${tag}: friendly error shown`, (await alert.count()) === 1, `${Date.now() - started} ms`);
    const text = (await alert.innerText().catch(() => "")).toLowerCase();
    check(`${tag}: no internal details`, !/mongo|mongoose|resend|error:|stack|econn|timeout/.test(text));
    if (js) check(`${tag}: focus on the alert`, await alert.evaluate((el) => el === document.activeElement));
    const after = await valuesOf(p);
    check(`${tag}: every value kept`, JSON.stringify(after) === JSON.stringify(before));
    await ctx.close();
  }
}

await b.close();
console.log(results.join("\n"));
if (refs.length) console.log(`\nREFS ${refs.join(" ")}`);
const failed = results.filter((r) => r.startsWith("FAIL")).length;
console.log(`\n${results.length - failed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
