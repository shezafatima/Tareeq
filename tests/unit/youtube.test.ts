import assert from "node:assert/strict";
import { test } from "node:test";
import { parseYouTubeId } from "../../src/lib/youtube.ts";

const ID = "abcDEF12345";

test("accepts Shorts, watch, youtu.be, embed, live and mobile links", () => {
  for (const url of [
    `https://www.youtube.com/shorts/${ID}`,
    `https://youtube.com/watch?v=${ID}&t=30s`,
    `https://youtu.be/${ID}?si=xyz`,
    `https://m.youtube.com/watch?feature=share&v=${ID}`,
    `https://www.youtube.com/embed/${ID}`,
    `https://www.youtube.com/live/${ID}?feature=share`,
    `  https://www.youtube.com/shorts/${ID}/  `,
    `http://youtu.be/${ID}`,
  ]) {
    assert.equal(parseYouTubeId(url), ID, url);
  }
});

test("accepts ids with dash and underscore", () => {
  assert.equal(parseYouTubeId("https://youtu.be/a-b_c-d_e-f"), "a-b_c-d_e-f");
});

test("rejects other hosts, look-alike hosts and unsafe schemes", () => {
  for (const url of [
    `https://evil.com/watch?v=${ID}`,
    `https://youtube.com.evil.com/shorts/${ID}`,
    `https://notyoutube.com/shorts/${ID}`,
    `javascript:alert(1)`,
    `ftp://youtu.be/${ID}`,
  ]) {
    assert.equal(parseYouTubeId(url), null, url);
  }
});

test("rejects bad ids and non-urls", () => {
  for (const url of [
    "",
    "not a url",
    "https://youtu.be/",
    "https://www.youtube.com/watch",
    "https://www.youtube.com/watch?v=short",
    "https://youtu.be/abcDEF123456",
    "https://youtu.be/abcDEF1234",
    "https://youtu.be/abc DEF1234",
    "https://youtu.be/abcDEF123!5",
    "https://www.youtube.com/channel/abcDEF12345",
  ]) {
    assert.equal(parseYouTubeId(url), null, url);
  }
  assert.equal(parseYouTubeId(undefined as unknown as string), null);
});
