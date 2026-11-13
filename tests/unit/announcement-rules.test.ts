import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ANNOUNCEMENT_LIMITS,
  announcementScript,
  DISMISS_COOKIE,
  isAllowedLink,
  parseAnnouncement,
  previewAnnouncement,
  selectAnnouncement,
  toAnnouncementFormValues,
  type AnnouncementFormValues,
  type StoredAnnouncement,
} from "../../src/lib/announcement/rules.ts";
import { toKarachiInput, toUtcFromKarachi } from "../../src/lib/announcement/time.ts";

// specs/034-pricing-certificate-announcement contracts/data-access.md §1

const form = (over: Partial<AnnouncementFormValues> = {}): AnnouncementFormValues => ({
  enabled: true,
  text: "Summer batch registrations are open",
  linkLabel: "",
  linkUrl: "",
  style: "saffron",
  startsAt: "",
  endsAt: "",
  dismissible: true,
  ...over,
});
const errorsOf = (v: AnnouncementFormValues) => {
  const r = parseAnnouncement(v);
  return r.success ? {} : r.errors;
};

const NOW = Date.parse("2026-12-01T10:00:00Z");
const stored = (over: Partial<StoredAnnouncement> = {}): StoredAnnouncement => ({
  enabled: true,
  text: "Summer batch registrations are open",
  style: "saffron",
  dismissible: true,
  updatedAt: "2026-11-30T08:00:00.000Z",
  ...over,
});

test("isAllowedLink accepts site paths and https addresses only", () => {
  for (const ok of ["/register", "/programs/teachers-workshop", "/", "https://example.com", "https://example.com/x?y=1"]) {
    assert.equal(isAllowedLink(ok), true, `should accept ${ok}`);
  }
  for (const bad of ["", "//evil.com", "http://example.com", "javascript:alert(1)", "mailto:a@b.com", "/ has space", "register", "https://", "data:text/html,x", "/a\\b", "https://exa mple.com"]) {
    assert.equal(isAllowedLink(bad), false, `should reject "${bad}"`);
  }
  assert.equal(isAllowedLink("/" + "a".repeat(ANNOUNCEMENT_LIMITS.linkUrl)), false);
});

test("a complete announcement parses", () => {
  const r = parseAnnouncement(form({ linkLabel: "Apply now", linkUrl: "/register", style: "navy", dismissible: false }));
  assert.equal(r.success, true);
  if (r.success) {
    assert.equal(r.data.linkUrl, "/register");
    assert.equal(r.data.style, "navy");
    assert.equal(r.data.dismissible, false);
    assert.equal(r.data.startsAt, null);
    assert.equal(r.data.endsAt, null);
  }
});

test("text is required while enabled and limited to 120 characters", () => {
  assert.ok(errorsOf(form({ text: "   " })).text);
  assert.ok(errorsOf(form({ text: "x".repeat(ANNOUNCEMENT_LIMITS.text + 1) })).text);
  assert.equal(errorsOf(form({ text: "x".repeat(ANNOUNCEMENT_LIMITS.text) })).text, undefined);
  // disabled with nothing typed is a valid way to switch it off
  assert.equal(parseAnnouncement(form({ enabled: false, text: "" })).success, true);
  // but an over-long text is refused even when disabled
  assert.ok(errorsOf(form({ enabled: false, text: "x".repeat(ANNOUNCEMENT_LIMITS.text + 1) })).text);
});

test("the link needs both a label and an allowed address", () => {
  assert.ok(errorsOf(form({ linkLabel: "Apply" })).linkUrl);
  assert.ok(errorsOf(form({ linkUrl: "/register" })).linkLabel);
  assert.ok(errorsOf(form({ linkLabel: "Apply", linkUrl: "javascript:alert(1)" })).linkUrl);
  assert.ok(errorsOf(form({ linkLabel: "Apply", linkUrl: "http://example.com" })).linkUrl);
  assert.ok(errorsOf(form({ linkLabel: "Apply", linkUrl: "//evil.com" })).linkUrl);
  assert.ok(errorsOf(form({ linkLabel: "x".repeat(ANNOUNCEMENT_LIMITS.linkLabel + 1), linkUrl: "/register" })).linkLabel);
  assert.deepEqual(errorsOf(form({ linkLabel: "Apply", linkUrl: "https://example.com/apply" })), {});
});

test("the style must be saffron or navy", () => {
  assert.ok(errorsOf(form({ style: "red" as never })).style);
});

test("dates are read as Pakistan time and the end must follow the start", () => {
  const r = parseAnnouncement(form({ startsAt: "2026-12-01T09:00", endsAt: "2026-12-05T18:30" }));
  assert.equal(r.success, true);
  if (r.success) {
    assert.equal(r.data.startsAt?.toISOString(), "2026-12-01T04:00:00.000Z");
    assert.equal(r.data.endsAt?.toISOString(), "2026-12-05T13:30:00.000Z");
  }
  assert.ok(errorsOf(form({ startsAt: "2026-12-05T09:00", endsAt: "2026-12-01T09:00" })).endsAt);
  assert.ok(errorsOf(form({ startsAt: "2026-12-01T09:00", endsAt: "2026-12-01T09:00" })).endsAt);
  assert.ok(errorsOf(form({ startsAt: "not a date" })).startsAt);
  assert.ok(errorsOf(form({ endsAt: "2026-02-31T09:00" })).endsAt);
  // either one alone is fine
  assert.equal(parseAnnouncement(form({ startsAt: "2026-12-01T09:00" })).success, true);
  assert.equal(parseAnnouncement(form({ endsAt: "2026-12-01T09:00" })).success, true);
});

test("Karachi time conversion is a fixed +05:00 and round-trips", () => {
  assert.equal(toUtcFromKarachi("2026-12-01T09:00")?.toISOString(), "2026-12-01T04:00:00.000Z");
  assert.equal(toUtcFromKarachi("2026-07-01T02:30")?.toISOString(), "2026-06-30T21:30:00.000Z");
  assert.equal(toUtcFromKarachi("2026-12-01T09:00:00")?.toISOString(), "2026-12-01T04:00:00.000Z");
  assert.equal(toKarachiInput(new Date("2026-12-01T04:00:00.000Z")), "2026-12-01T09:00");
  assert.equal(toKarachiInput(new Date("2026-06-30T21:30:00.000Z")), "2026-07-01T02:30");
  assert.equal(toKarachiInput(undefined), "");
  for (const bad of ["", "2026-13-01T09:00", "2026-12-01", "2026-12-01T25:00", "2026-02-30T09:00", "abc"]) {
    assert.equal(toUtcFromKarachi(bad), null, `should reject "${bad}"`);
  }
});

test("selectAnnouncement hides a disabled, empty or ended announcement", () => {
  assert.equal(selectAnnouncement(null, NOW), null);
  assert.equal(selectAnnouncement(stored({ enabled: false }), NOW), null);
  assert.equal(selectAnnouncement(stored({ text: "   " }), NOW), null);
  assert.equal(selectAnnouncement(stored({ endsAt: "2026-12-01T10:00:00.000Z" }), NOW), null);
  assert.equal(selectAnnouncement(stored({ endsAt: "2026-11-30T00:00:00.000Z" }), NOW), null);
  assert.notEqual(selectAnnouncement(stored({ endsAt: "2026-12-01T10:00:01.000Z" }), NOW), null);
});

test("a future start still gives a view; the browser hides it until then", () => {
  const v = selectAnnouncement(stored({ startsAt: "2026-12-10T00:00:00.000Z" }), NOW);
  assert.notEqual(v, null);
  assert.equal(v?.startsAt, Date.parse("2026-12-10T00:00:00.000Z"));
});

test("the view carries the version, link and compact flag", () => {
  const v = selectAnnouncement(stored({ linkLabel: "Apply", linkUrl: "/register" }), NOW);
  assert.equal(v?.version, Date.parse("2026-11-30T08:00:00.000Z"));
  assert.deepEqual(v?.link, { label: "Apply", href: "/register", external: false });
  assert.equal(v?.compact, false);
  assert.equal(selectAnnouncement(stored({ linkLabel: "Go", linkUrl: "https://example.com" }), NOW)?.link?.external, true);
  assert.equal(selectAnnouncement(stored({ text: "Short news", linkLabel: "Read", linkUrl: "/blog" }), NOW)?.compact, true);
  assert.equal(selectAnnouncement(stored({ text: "x".repeat(ANNOUNCEMENT_LIMITS.compactChars) }), NOW)?.compact, true);
  assert.equal(selectAnnouncement(stored({ text: "x".repeat(ANNOUNCEMENT_LIMITS.compactChars + 1) }), NOW)?.compact, false);
});

test("a stored link that is no longer allowed is left out", () => {
  const v = selectAnnouncement(stored({ linkLabel: "Go", linkUrl: "javascript:alert(1)" }), NOW);
  assert.equal(v?.link, undefined);
});

test("dates survive a JSON round trip through the cache", () => {
  const doc = JSON.parse(JSON.stringify({ ...stored(), updatedAt: new Date("2026-11-30T08:00:00Z"), startsAt: new Date("2026-12-01T00:00:00Z") }));
  const v = selectAnnouncement(doc, NOW);
  assert.equal(v?.version, Date.parse("2026-11-30T08:00:00Z"));
  assert.equal(v?.startsAt, Date.parse("2026-12-01T00:00:00Z"));
});

test("the preview shows the bar even while it is switched off, and nothing without text", () => {
  assert.equal(previewAnnouncement(form({ text: "  " })), null);
  const v = previewAnnouncement(form({ enabled: false, linkLabel: "Apply", linkUrl: "/register", style: "navy" }));
  assert.equal(v?.style, "navy");
  assert.equal(v?.link?.href, "/register");
  assert.equal(previewAnnouncement(form({ linkLabel: "Apply", linkUrl: "javascript:x" }))?.link, undefined);
});

test("form values come from a stored document, with defaults for none", () => {
  assert.deepEqual(toAnnouncementFormValues(null), form({ enabled: false, text: "" }));
  const f = toAnnouncementFormValues(stored({ linkLabel: "Apply", linkUrl: "/register", style: "navy", startsAt: "2026-12-01T04:00:00.000Z", dismissible: false }));
  assert.equal(f.startsAt, "2026-12-01T09:00");
  assert.equal(f.endsAt, "");
  assert.equal(f.style, "navy");
  assert.equal(f.dismissible, false);
  assert.equal(f.linkUrl, "/register");
});

test("the inline script carries numbers only and fails open", () => {
  const js = announcementScript({ version: 1700000000000, startsAt: 1700000100000, endsAt: undefined });
  assert.ok(js.includes('{"v":1700000000000,"s":1700000100000,"e":null}'));
  assert.ok(js.includes(DISMISS_COOKIE));
  assert.ok(js.includes("try{") && js.includes("catch"));
  assert.ok(!js.includes("</script"));
  // anything that is not a finite number is dropped, so no text can reach the script
  const hostile = announcementScript({ version: 5, startsAt: "</script><script>alert(1)" as never, endsAt: NaN });
  assert.ok(hostile.includes('{"v":5,"s":null,"e":null}'));
  assert.ok(!hostile.includes("alert"));
});

test("the inline script decides the way the server does", () => {
  const run = (cookie: string, now: number, view: { version: number; startsAt?: number; endsAt?: number }) => {
    const root = { dataset: {} as Record<string, string> };
    const fn = new Function("document", "Date", announcementScript(view));
    fn({ cookie, documentElement: root }, { now: () => now });
    return root.dataset.announce;
  };
  const view = { version: 111, startsAt: 1000, endsAt: 2000 };
  assert.equal(run("", 1500, view), undefined); // inside the window, not dismissed
  assert.equal(run(`${DISMISS_COOKIE}=111`, 1500, view), "off"); // dismissed
  assert.equal(run(`a=1; ${DISMISS_COOKIE}=111; b=2`, 1500, view), "off");
  assert.equal(run(`${DISMISS_COOKIE}=110`, 1500, view), undefined); // an older announcement's dismissal does not count
  assert.equal(run("", 999, view), "off"); // before the start
  assert.equal(run("", 2000, view), "off"); // at the end
  assert.equal(run("", 5, { version: 1 }), undefined); // no window
});
