import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { howItWorks } from "../../src/content/how-it-works.ts";
import { ourWay } from "../../src/content/our-way.ts";
import { drawn, headY, pieceD } from "../../src/lib/our-way/path.ts";

test("straight and rail pieces are a vertical line at the box's centre", () => {
  assert.equal(pieceD({ kind: "straight" }, 100, 100), "M50 0V100");
  assert.equal(pieceD({ kind: "rail" }, 12, 900), "M6 0V900");
});

test("a crossing runs edge to edge and is vertical at both ends, so it joins the rails", () => {
  assert.equal(pieceD({ kind: "cross", from: "left" }, 100, 100), "M0 0C0 50 100 50 100 100");
  assert.equal(pieceD({ kind: "cross", from: "right" }, 100, 100), "M100 0C100 50 0 50 0 100");
  assert.equal(pieceD({ kind: "cross", from: "left" }, 1200, 176), "M0 0C0 88 1200 88 1200 176");
});

test("the drawn point starts 60% down the first screen", () => {
  assert.equal(headY(0, 1000, 4000), 600);
});

test("the drawn point reaches the end of the document at the bottom of the page", () => {
  assert.equal(headY(4000, 1000, 4000), 5000);
  assert.equal(headY(500, 1800, 500), 2300);
});

test("the drawn point only moves forward while scrolling down", () => {
  let previous = -1;
  for (let y = 0; y <= 4000; y += 100) {
    const head = headY(y, 844, 4000);
    assert.ok(head > previous);
    previous = head;
  }
});

test("overscrolling on a phone keeps the drawn point on the page's scale", () => {
  assert.equal(headY(4100, 1000, 4000), 5100);
  assert.equal(headY(-50, 1000, 4000), 550);
});

test("a page that cannot scroll counts as complete", () => {
  assert.equal(headY(0, 1000, 0), Number.POSITIVE_INFINITY);
  assert.equal(drawn(headY(0, 1000, -10), 900, 500), 1);
});

test("drawn stays between 0 and 1", () => {
  assert.equal(drawn(50, 100, 200), 0);
  assert.equal(drawn(200, 100, 200), 0.5);
  assert.equal(drawn(900, 100, 200), 1);
  assert.equal(drawn(100, 100, 0), 1);
  assert.equal(drawn(99, 100, 0), 0);
});

test("the opening uses the owner's exact wording", () => {
  assert.equal(ourWay.opening.word, "طریق");
  assert.equal(ourWay.opening.meaning, "Tareeq means 'the way'.");
  assert.equal(ourWay.opening.manifesto, "AI is learned by doing, not by watching.");
});

test("the h1 and the page's stored heading match", () => {
  // read as text: this file's imports do not resolve under the test runner
  const source = readFileSync("src/content/data/pages.ts", "utf8");
  assert.ok(source.includes(`heading: "${ourWay.opening.meaning}"`));
});

test("the problem has 2 or 3 short lines", () => {
  assert.ok(ourWay.problem.lines.length >= 2 && ourWay.problem.lines.length <= 3);
});

test("the four principles are in the owner's order", () => {
  assert.deepEqual(
    ourWay.principles.items.map((p) => [p.number, p.title]),
    [
      ["01", "Build every session"],
      ["02", "Understand before you trust"],
      ["03", "Real problems, local context"],
      ["04", "Teacher and learner, side by side"],
    ],
  );
  assert.match(ourWay.principles.items[3].line, /ustad/i);
  assert.match(ourWay.principles.items[3].line, /shagird/i);
});

test("a session goes Try, Make, Reflect", () => {
  assert.deepEqual(ourWay.session.steps.map((s) => [s.number, s.name]), [[1, "Try"], [2, "Make"], [3, "Reflect"]]);
});

test("the session does not repeat How it works", () => {
  const taken = howItWorks.steps.flatMap((s) => [s.title, s.line]);
  for (const step of ourWay.session.steps) assert.ok(!taken.includes(step.line), step.line);
});

test("the closing has the owner's labels", () => {
  assert.equal(ourWay.closing.mentorLabel, "Meet your mentor");
  assert.equal(ourWay.closing.bookLabel, "Book a workshop");
});

test("the copy has no hype words", () => {
  assert.doesNotMatch(JSON.stringify(ourWay), /empower|unlock|revolutioni[sz]e/i);
});
