import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CERTIFICATE_DEFAULTS,
  CERTIFICATE_LIMITS,
  mergeCertificate,
  parseCertificate,
  SAMPLE_CERTIFICATE,
  toCertificateFormValues,
  type CertificateFormValues,
} from "../../src/lib/certificate/content.ts";

// specs/034-pricing-certificate-announcement FR-012..FR-016, research R8

const image = { url: "https://res.cloudinary.com/demo/image/upload/v1/tareeq/site/cert.png", publicId: "tareeq/site/cert", width: 1600, height: 1130, alt: "Our certificate" };
const form = (over: Partial<CertificateFormValues> = {}): CertificateFormValues => ({
  enabled: true,
  heading: "A certificate that marks the work",
  text: "Every participant receives one.",
  bullets: ["One", "Two", "Three"],
  image: null,
  ...over,
});
const errorsOf = (v: CertificateFormValues) => {
  const r = parseCertificate(v);
  return r.success ? {} : r.errors;
};

test("with nothing stored the defaults and the sample certificate are used", () => {
  const c = mergeCertificate(null);
  assert.equal(c.enabled, true);
  assert.equal(c.heading, CERTIFICATE_DEFAULTS.heading);
  assert.equal(c.text, CERTIFICATE_DEFAULTS.text);
  assert.deepEqual(c.bullets, CERTIFICATE_DEFAULTS.bullets);
  assert.equal(c.isSample, true);
  assert.deepEqual(c.image, SAMPLE_CERTIFICATE);
  assert.match(SAMPLE_CERTIFICATE.alt, /sample/i);
});

test("stored values win field by field and blanks fall back to the defaults", () => {
  const c = mergeCertificate({ enabled: true, heading: "Our certificate", text: "", bullets: ["  ", ""] });
  assert.equal(c.heading, "Our certificate");
  assert.equal(c.text, CERTIFICATE_DEFAULTS.text);
  assert.deepEqual(c.bullets, CERTIFICATE_DEFAULTS.bullets);
  assert.equal(mergeCertificate({ bullets: [" A ", "B"] }).bullets.join("|"), "A|B");
  assert.equal(mergeCertificate({ bullets: ["1", "2", "3", "4", "5", "6"] }).bullets.length, CERTIFICATE_LIMITS.bulletsMax);
});

test("the toggle is read as stored, and on when never saved", () => {
  assert.equal(mergeCertificate({ enabled: false }).enabled, false);
  assert.equal(mergeCertificate({}).enabled, true);
});

test("an uploaded image replaces the sample and keeps its alt text", () => {
  const c = mergeCertificate({ image });
  assert.equal(c.isSample, false);
  assert.deepEqual(c.image, { src: image.url, width: 1600, height: 1130, alt: "Our certificate" });
  // a stored image with no usable url is ignored
  assert.equal(mergeCertificate({ image: { ...image, url: "" } }).isSample, true);
});

test("the default copy describes a Tareeq certificate and claims no accreditation", () => {
  const copy = [CERTIFICATE_DEFAULTS.heading, CERTIFICATE_DEFAULTS.text, ...CERTIFICATE_DEFAULTS.bullets].join(" ");
  assert.match(copy, /certificate of completion/i);
  assert.match(copy, /Tareeq/);
  assert.doesNotMatch(copy, /accredit|government|universit|board|\bHEC\b|verified|signed|official|recogni[sz]ed|approved/i);
  assert.equal(CERTIFICATE_DEFAULTS.bullets.length, 3);
});

test("a complete form parses and blank bullets are dropped", () => {
  const r = parseCertificate(form({ bullets: ["One", "  ", "Two", ""] }));
  assert.equal(r.success, true);
  if (r.success) assert.deepEqual(r.data.bullets, ["One", "Two"]);
});

test("heading and text are required while enabled, with length limits", () => {
  assert.ok(errorsOf(form({ heading: "  " })).heading);
  assert.ok(errorsOf(form({ text: "" })).text);
  assert.ok(errorsOf(form({ heading: "x".repeat(CERTIFICATE_LIMITS.heading + 1) })).heading);
  assert.ok(errorsOf(form({ text: "x".repeat(CERTIFICATE_LIMITS.text + 1) })).text);
  assert.equal(errorsOf(form({ heading: "x".repeat(CERTIFICATE_LIMITS.heading) })).heading, undefined);
  // switched off, the section is not shown, so empty copy is fine; too-long copy is still refused
  assert.equal(parseCertificate(form({ enabled: false, heading: "", text: "", bullets: [] })).success, true);
  assert.ok(errorsOf(form({ enabled: false, heading: "x".repeat(CERTIFICATE_LIMITS.heading + 1) })).heading);
});

test("one to four bullets are needed while enabled, each within the limit", () => {
  assert.ok(errorsOf(form({ bullets: [] })).bullets);
  assert.ok(errorsOf(form({ bullets: ["", "  "] })).bullets);
  assert.ok(errorsOf(form({ bullets: ["1", "2", "3", "4", "5"] })).bullets);
  assert.equal(errorsOf(form({ bullets: ["1", "2", "3", "4"] })).bullets, undefined);
  const long = errorsOf(form({ bullets: ["ok", "x".repeat(CERTIFICATE_LIMITS.bullet + 1)] }));
  assert.ok(long["bullets.1"]);
});

test("an image needs alt text", () => {
  assert.ok(errorsOf(form({ image: { ...image, alt: "  " } }))["image.alt"]);
  assert.ok(errorsOf(form({ image: { ...image, alt: "x".repeat(201) } }))["image.alt"]);
  const ok = parseCertificate(form({ image }));
  assert.equal(ok.success, true);
  if (ok.success) assert.equal(ok.data.image?.alt, "Our certificate");
  assert.equal(parseCertificate(form({ image: null })).success, true);
});

test("form values show what the site uses now, defaults included", () => {
  const f = toCertificateFormValues(null);
  assert.equal(f.enabled, true);
  assert.equal(f.heading, CERTIFICATE_DEFAULTS.heading);
  assert.deepEqual(f.bullets, CERTIFICATE_DEFAULTS.bullets);
  assert.equal(f.image, null);
  assert.deepEqual(toCertificateFormValues({ image }).image, image);
  assert.equal(toCertificateFormValues({ enabled: false }).enabled, false);
});
