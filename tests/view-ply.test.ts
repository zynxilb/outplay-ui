// tests/view-ply.test.ts
// Run: node --test tests/view-ply.test.ts

import { test } from "node:test";
import assert from "node:assert/strict";

import { resolveViewPly } from "../lib/view-ply.ts";

test("null → null (live)", () => {
  assert.equal(resolveViewPly(null, 5), null);
});

test("NaN → null (bug guard)", () => {
  assert.equal(resolveViewPly(NaN, 5), null);
});

test("Infinity → null", () => {
  assert.equal(resolveViewPly(Infinity, 5), null);
});

test("-Infinity → null", () => {
  assert.equal(resolveViewPly(-Infinity, 5), null);
});

test("1.5 (non-integer) → null", () => {
  assert.equal(resolveViewPly(1.5, 5), null);
});

test("0 (invalid ply) → null", () => {
  assert.equal(resolveViewPly(0, 5), null);
});

test("negative ply → null", () => {
  assert.equal(resolveViewPly(-1, 5), null);
});

test("1 → 1 (valid)", () => {
  assert.equal(resolveViewPly(1, 5), 1);
});

test("4 (last-1) → 4", () => {
  assert.equal(resolveViewPly(4, 5), 4);
});

test("5 (=== movesLength, last ply → live)", () => {
  assert.equal(resolveViewPly(5, 5), null);
});

test("6 (> movesLength) → null", () => {
  assert.equal(resolveViewPly(6, 5), null);
});

test("movesLength = 0 → null", () => {
  assert.equal(resolveViewPly(1, 0), null);
});

test("movesLength = 1 (only one move) → null (it's live)", () => {
  assert.equal(resolveViewPly(1, 1), null);
});
