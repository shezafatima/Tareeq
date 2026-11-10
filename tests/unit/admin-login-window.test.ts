import assert from "node:assert/strict";
import { test } from "node:test";
import { isOverLimit, LOGIN_MAX_FAILURES, LOGIN_WINDOW_MS, windowStart } from "../../src/lib/admin/login-window.ts";

test("four failures are allowed, the fifth locks the address", () => {
  assert.equal(LOGIN_MAX_FAILURES, 5);
  assert.equal(isOverLimit(0), false);
  assert.equal(isOverLimit(4), false);
  assert.equal(isOverLimit(5), true);
  assert.equal(isOverLimit(9), true);
});

test("the window is exactly 15 minutes", () => {
  assert.equal(LOGIN_WINDOW_MS, 15 * 60 * 1000);
  const now = new Date("2026-11-10T12:00:00.000Z");
  assert.equal(windowStart(now).toISOString(), "2026-11-10T11:45:00.000Z");
});
