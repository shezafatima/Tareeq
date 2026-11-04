import assert from "node:assert/strict";
import { test } from "node:test";
import { normalisePhone } from "../../src/lib/leads/phone.ts";

const accepted: [string, string][] = [
  ["03001234567", "+923001234567"],
  ["0300-1234567", "+923001234567"],
  ["0300 123 4567", "+923001234567"],
  ["+92 300 1234567", "+923001234567"],
  ["923001234567", "+923001234567"],
  ["00923001234567", "+923001234567"],
  ["3001234567", "+923001234567"],
  ["042 35761234", "+924235761234"],
  ["+44 7700 900123", "+447700900123"],
  ["+1 (415) 555-2671", "+14155552671"],
];

const rejected = ["", "12345", "0300123", "+92 300 12345678901", "abcdefghij", "+0 1234 5678", "03001234567x"];

for (const [input, expected] of accepted) {
  test(`accepts ${JSON.stringify(input)}`, () => {
    assert.deepEqual(normalisePhone(input), { ok: true, e164: expected });
  });
}

for (const input of rejected) {
  test(`rejects ${JSON.stringify(input)}`, () => {
    assert.deepEqual(normalisePhone(input), { ok: false });
  });
}
