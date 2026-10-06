// tests/next-board-action.test.ts
// Run: node --test tests/next-board-action.test.ts

import { test } from "node:test";
import assert from "node:assert/strict";

import { nextBoardAction } from "../lib/next-board-action.ts";

// ─── live → live ─────────────────────────────────────────────────────

test("live → live (null → null): no-op", () => {
  assert.equal(nextBoardAction(null, null, null, 5), null);
});

// ─── entering preview ────────────────────────────────────────────────

test("enter preview (null → 3): goto(3)", () => {
  assert.deepEqual(nextBoardAction(null, 3, null, 5), { goto: 3 });
});

test("enter preview (null → 1): goto(1)", () => {
  assert.deepEqual(nextBoardAction(null, 1, null, 5), { goto: 1 });
});

// ─── navigating within preview ───────────────────────────────────────

test("navigate within preview (3 → 1): goto(1)", () => {
  assert.deepEqual(nextBoardAction(3, 1, null, 5), { goto: 1 });
});

test("navigate within preview (1 → 4): goto(4)", () => {
  assert.deepEqual(nextBoardAction(1, 4, null, 5), { goto: 4 });
});

test("same viewPly twice (3 → 3): idempotent goto(3)", () => {
  assert.deepEqual(nextBoardAction(3, 3, null, 5), { goto: 3 });
});

// ─── exiting preview ─────────────────────────────────────────────────

test("exit preview (3 → null, saved=5, hL=5): goto(5)", () => {
  assert.deepEqual(nextBoardAction(3, null, 5, 5), { goto: 5 });
});

test("exit preview with saved > historyLength: clamped to historyLength", () => {
  assert.deepEqual(nextBoardAction(3, null, 10, 5), { goto: 5 });
});

test("exit preview with saved=null: fallback to historyLength", () => {
  assert.deepEqual(nextBoardAction(3, null, null, 5), { goto: 5 });
});

test("exit preview with savedLivePly < historyLength: goto(saved)", () => {
  assert.deepEqual(nextBoardAction(3, null, 2, 5), { goto: 2 });
});

// ─── edge case: viewPly > historyLength ──────────────────────────────

test("enter preview with viewPly > historyLength: clamped", () => {
  assert.deepEqual(nextBoardAction(null, 10, null, 5), { goto: 5 });
});

test("navigate to viewPly > historyLength: clamped", () => {
  assert.deepEqual(nextBoardAction(3, 10, null, 5), { goto: 5 });
});
