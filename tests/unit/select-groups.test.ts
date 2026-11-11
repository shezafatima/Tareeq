import assert from "node:assert/strict";
import { test } from "node:test";
import { groupOptions } from "../../src/components/ui/select-groups.ts";

test("ungrouped options form a single bare run", () => {
  const runs = groupOptions([
    { value: "a", label: "A" },
    { value: "b", label: "B" },
  ]);
  assert.equal(runs.length, 1);
  assert.equal(runs[0].group, undefined);
  assert.deepEqual(runs[0].options.map((o) => o.value), ["a", "b"]);
});

test("consecutive options in the same group form one run, in order", () => {
  const runs = groupOptions([
    { value: "t1", label: "T1", group: "For Teachers" },
    { value: "b1", label: "B1", group: "AI Basics" },
    { value: "b2", label: "B2", group: "AI Basics" },
  ]);
  assert.deepEqual(
    runs.map((r) => [r.group, r.options.map((o) => o.value)]),
    [
      ["For Teachers", ["t1"]],
      ["AI Basics", ["b1", "b2"]],
    ],
  );
});

test("a trailing ungrouped option (Not sure yet) gets its own bare run", () => {
  const runs = groupOptions([
    { value: "b1", label: "B1", group: "AI Basics" },
    { value: "not-sure", label: "Not sure yet" },
  ]);
  assert.equal(runs.length, 2);
  assert.equal(runs[1].group, undefined);
  assert.deepEqual(runs[1].options.map((o) => o.value), ["not-sure"]);
});

test("an empty list gives no runs", () => {
  assert.deepEqual(groupOptions([]), []);
});
