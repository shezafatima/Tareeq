import assert from "node:assert/strict";
import { test } from "node:test";
import { renderMarkdown } from "../../src/lib/programs/markdown.ts";

test("renders the basics", () => {
  const html = renderMarkdown("Some **bold** text\n\n- one\n- two");
  assert.match(html, /<strong>bold<\/strong>/);
  assert.match(html, /<li>one<\/li>/);
});

test("a level-one heading becomes h2, so each page keeps one h1", () => {
  assert.match(renderMarkdown("# Title"), /<h2[^>]*>Title<\/h2>/);
  assert.doesNotMatch(renderMarkdown("# Title"), /<h1/);
});

test("links are kept with a safe rel", () => {
  const html = renderMarkdown("[site](https://example.com) [mail](mailto:a@b.co)");
  assert.match(html, /href="https:\/\/example\.com"/);
  assert.match(html, /href="mailto:a@b\.co"/);
  assert.match(html, /rel="noopener noreferrer"/);
});

const UNSAFE: [string, string, RegExp][] = [
  ["script tag", "before <script>alert(1)</script> after", /<script|alert\(1\)/],
  ["event handler", '<p onclick="alert(1)">hi</p>', /onclick/],
  ["image with onerror", '<img src="x" onerror="alert(1)">', /<img|onerror/],
  ["markdown image", "![a](https://example.com/a.png)", /<img/],
  ["javascript link", "[x](javascript:alert(1))", /javascript:/],
  ["encoded javascript link", '<a href="jav&#x61;script:alert(1)">x</a>', /javascript:|href/],
  ["data link", '<a href="data:text/html,<script>alert(1)</script>">x</a>', /data:|<script/],
  ["protocol-relative link", '<a href="//evil.example">x</a>', /evil\.example/],
  ["inline style", '<p style="position:fixed">hi</p>', /style=/],
  ["iframe", '<iframe src="https://evil.example"></iframe>', /<iframe/],
  ["style tag", "<style>body{display:none}</style>", /<style|display:none/],
  ["svg", '<svg onload="alert(1)"></svg>', /<svg|onload/],
];

for (const [name, input, banned] of UNSAFE) {
  test(`strips ${name}`, () => assert.doesNotMatch(renderMarkdown(input), banned));
}

test("safe text survives around removed markup", () => {
  const html = renderMarkdown("before <script>alert(1)</script> after");
  assert.match(html, /before/);
  assert.match(html, /after/);
});
