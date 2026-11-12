import assert from "node:assert/strict";
import { test } from "node:test";
import { codeBlock, insertAt, link, numberLines, prefixLines, wrap, type Edit } from "../../src/lib/blog/editor-format.ts";

const at = (value: string, start: number, end = start): Edit => ({ value, start, end });
const picked = (e: Edit) => e.value.slice(e.start, e.end);

test("wrap puts markers around the selection and keeps it selected", () => {
  const out = wrap(at("say hello now", 4, 9), "**");
  assert.equal(out.value, "say **hello** now");
  assert.equal(picked(out), "hello");
});

test("wrap with nothing selected inserts the markers and a placeholder, selected", () => {
  const out = wrap(at("ab", 1), "**");
  assert.equal(out.value, "a**text**b");
  assert.equal(picked(out), "text");
});

test("wrap again on a wrapped selection takes the markers off", () => {
  const outside = wrap(at("say **hello** now", 6, 11), "**");
  assert.equal(outside.value, "say hello now");
  assert.equal(picked(outside), "hello");
  const inside = wrap(at("say **hello** now", 4, 13), "**");
  assert.equal(inside.value, "say hello now");
  assert.equal(picked(inside), "hello");
});

test("italic with a single marker does not mistake bold for already italic", () => {
  const out = wrap(at("**hello**", 2, 7), "*");
  assert.equal(out.value, "***hello***");
  assert.equal(picked(out), "hello");
});

test("prefixLines prefixes every line the selection touches", () => {
  const out = prefixLines(at("one\ntwo\nthree", 5, 9), "- ");
  assert.equal(out.value, "one\n- two\n- three");
  assert.equal(picked(out), "- two\n- three");
});

test("prefixLines on a cursor in a line works on that line only", () => {
  const out = prefixLines(at("one\ntwo", 1), "## ");
  assert.equal(out.value, "## one\ntwo");
});

test("prefixLines toggles off when every line already has the prefix", () => {
  const out = prefixLines(at("> a\n> b", 0, 7), "> ");
  assert.equal(out.value, "a\nb");
});

test("prefixLines replaces a different heading level instead of stacking", () => {
  const out = prefixLines(at("### Title", 3), "## ");
  assert.equal(out.value, "## Title");
});

test("numberLines numbers the lines and toggles off", () => {
  const on = numberLines(at("a\nb\nc", 0, 5));
  assert.equal(on.value, "1. a\n2. b\n3. c");
  const off = numberLines(at(on.value, 0, on.value.length));
  assert.equal(off.value, "a\nb\nc");
});

test("link wraps the selection and selects the address placeholder", () => {
  const out = link(at("see docs here", 4, 8));
  assert.equal(out.value, "see [docs](https://) here");
  assert.equal(picked(out), "https://");
  const empty = link(at("", 0));
  assert.equal(empty.value, "[link text](https://)");
  assert.equal(picked(empty), "link text");
});

test("codeBlock: inline backticks for one line, a fenced block for several", () => {
  const inline = codeBlock(at("use npm run dev now", 4, 15));
  assert.equal(inline.value, "use `npm run dev` now");
  const fence = "```";
  const block = codeBlock(at("a\nb", 0, 3));
  assert.equal(block.value, `${fence}\na\nb\n${fence}`);
  assert.equal(picked(block), "a\nb");
});

test("insertAt replaces the selection and leaves the cursor after the text", () => {
  const out = insertAt(at("abcdef", 2, 4), "XY");
  assert.equal(out.value, "abXYef");
  assert.equal(out.start, 4);
  assert.equal(out.end, 4);
  const plain = insertAt(at("ab", 2), "!");
  assert.equal(plain.value, "ab!");
  assert.equal(plain.start, 3);
});
