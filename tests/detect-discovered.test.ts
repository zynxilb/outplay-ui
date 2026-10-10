// tests/detect-discovered.test.ts
// Run: node --test tests/detect-discovered.test.ts

import { test } from "node:test";
import assert from "node:assert/strict";
import { detectDiscovered } from "../lib/motifs.ts";

test("discovered: knight vacates a-file, rook attacks queen", () => {
  // White Ra1, Na4. Black Qa8, Kd8. White plays Nb6 (from a4 to b6),
  // clearing the a-file so Ra1 attacks Qa8.
  const fen = "q2k4/8/8/8/N7/8/8/R3K3 w - - 0 1";
  const results = detectDiscovered(fen, "a4", "b6", "w");
  assert.ok(results.length >= 1, `expected >=1 discovered attack, got ${results.length}`);
  const found = results.find(r => r.revealedPiece === "a1" && r.target === "a8");
  assert.ok(found, "should find a1 -> a8 discovered attack on queen");
  assert.equal(found!.targetPiece, "q");
});
