import assert from "node:assert/strict";
import { test } from "node:test";
import { completedIndices, nextIndex, resolveMode, shouldPreloadNext } from "../../src/lib/stepper.ts";

test("nextIndex moves forward and wraps from the last step to the first", () => {
  assert.equal(nextIndex(0, 3), 1);
  assert.equal(nextIndex(1, 3), 2);
  assert.equal(nextIndex(2, 3), 0);
});

test("completedIndices lists the steps before the active one", () => {
  assert.deepEqual(completedIndices(0), []);
  assert.deepEqual(completedIndices(1), [0]);
  assert.deepEqual(completedIndices(2), [0, 1]);
});

test("resolveMode is manual for reduced motion, data saver or blocked autoplay", () => {
  const base = { reducedMotion: false, saveData: false, autoplayBlocked: false };
  assert.equal(resolveMode(base), "auto");
  assert.equal(resolveMode({ ...base, reducedMotion: true }), "manual");
  assert.equal(resolveMode({ ...base, saveData: true }), "manual");
  assert.equal(resolveMode({ ...base, autoplayBlocked: true }), "manual");
});

test("shouldPreloadNext is true only in the last 3 seconds of a known duration", () => {
  assert.equal(shouldPreloadNext(10, 20), false);
  assert.equal(shouldPreloadNext(18, 20), true);
  assert.equal(shouldPreloadNext(3, 6), false);
  assert.equal(shouldPreloadNext(3.5, 6), true);
  assert.equal(shouldPreloadNext(1, Number.NaN), false);
  assert.equal(shouldPreloadNext(1, 0), false);
});
