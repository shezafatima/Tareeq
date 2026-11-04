import assert from "node:assert/strict";
import { test } from "node:test";
import { deriveKey, firstForwardedAddress } from "../../src/lib/leads/rate-key.ts";

const SECRET = "a".repeat(40);

test("the same address and secret give the same key", () => {
  assert.equal(deriveKey("203.0.113.9", SECRET), deriveKey("203.0.113.9", SECRET));
});

test("different addresses or secrets give different keys", () => {
  assert.notEqual(deriveKey("203.0.113.9", SECRET), deriveKey("203.0.113.10", SECRET));
  assert.notEqual(deriveKey("203.0.113.9", SECRET), deriveKey("203.0.113.9", "b".repeat(40)));
});

test("the key is 64 hex characters and never contains the address", () => {
  const key = deriveKey("203.0.113.9", SECRET);
  assert.match(key, /^[0-9a-f]{64}$/);
  assert.ok(!key.includes("203.0.113.9"));
});

test("firstForwardedAddress takes the first address and tolerates spaces and gaps", () => {
  assert.equal(firstForwardedAddress("1.2.3.4, 10.0.0.1"), "1.2.3.4");
  assert.equal(firstForwardedAddress("  1.2.3.4  "), "1.2.3.4");
  assert.equal(firstForwardedAddress("2001:db8::1, 10.0.0.1"), "2001:db8::1");
  assert.equal(firstForwardedAddress(""), null);
  assert.equal(firstForwardedAddress("  ,1.2.3.4"), null);
  assert.equal(firstForwardedAddress(null), null);
  assert.equal(firstForwardedAddress(undefined), null);
});
