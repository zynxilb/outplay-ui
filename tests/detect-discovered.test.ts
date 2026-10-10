// tests/detect-discovered.test.ts
// Run: node --test tests/detect-discovered.test.ts

import { test } from "node:test";
import assert from "node:assert/strict";
import { detectDiscovered } from "../lib/motifs.ts";

// ===== Positive: rook on a1, knight leaves a4, attacks Qa8 (vertical) =====
test("discovered: knight vacates a-file (vertical), rook hits queen", () => {
  const fen = "q2k4/8/8/8/N7/8/8/R3K3 w - - 0 1";
  const results = detectDiscovered(fen, "a4", "b6", "w");
  assert.ok(results.length >= 1, `expected >=1, got ${results.length}`);
  const found = results.find(r => r.revealedPiece === "a1" && r.target === "a8");
  assert.ok(found, "should find a1 -> a8 (queen)");
  assert.equal(found!.targetPiece, "q");
});

// ===== Positive: bishop b2, knight leaves d4, hits Qh8 (diagonal) =====
test("discovered: knight vacates diagonal, bishop hits queen", () => {
  // White Bb2, Nd4, Ke1. Black Qh8, Ke8. Nd4-f5 clears b2's diagonal to h8.
  // b2-c3-d4-e5-f6-g7-h8
  const fen = "4k2q/8/8/8/3N4/8/1B6/4K3 w - - 0 1";
  const results = detectDiscovered(fen, "d4", "f5", "w");
  const found = results.find(r => r.revealedPiece === "b2" && r.target === "h8");
  assert.ok(found, "should find b2 -> h8 (queen) via diagonal");
  assert.equal(found!.targetPiece, "q");
});

// ===== Negative: knight stays on file (still blocks) =====
test("negative: knight stays on a-file (still blocks)", () => {
  const fen = "q2k4/8/8/8/N7/8/8/R3K3 w - - 0 1";
  const results = detectDiscovered(fen, "a4", "a5", "w");
  const found = results.find(r => r.revealedPiece === "a1" && r.target === "a8");
  assert.equal(found, undefined, "no discovered attack when blocker stays on line");
});

// ===== Negative: no enemy piece behind =====
test("negative: rook revealed but no enemy piece behind", () => {
  const fen = "3k4/8/8/8/N7/8/8/R3K3 w - - 0 1";
  const results = detectDiscovered(fen, "a4", "b6", "w");
  const found = results.find(r => r.revealedPiece === "a1");
  assert.equal(found, undefined, "no enemy behind rook, no discovered attack");
});
