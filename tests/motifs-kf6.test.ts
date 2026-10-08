// tests/motifs-kf6.test.ts
//
// Characterization test for discovered-attack detection in the Kf6+
// scenario. Documents that detectDiscovered() correctly identifies
// geometric discovered attacks from king moves.

import { test } from "node:test";
import assert from "node:assert/strict";
import { detectDiscovered } from "../lib/motifs.ts";

// Position: white king on e6 blocks rook on e1 from attacking e8.
// Move Kf6 unblocks the rook, delivering discovered check to black king.
const FEN_KF6_SETUP = "4k3/8/4K3/8/8/8/8/4R3 w - - 0 1";

test("Kf6+ detected as discovered attack (geometric)", () => {
  const result = detectDiscovered(FEN_KF6_SETUP, "e6", "f6", "w");

  assert.equal(
    result.length,
    1,
    "exactly one discovered attack should be detected"
  );

  const d = result[0];
  assert.equal(d.revealedPiece, "e1", "rook on e1 is the revealed piece");
  assert.equal(d.revealedPieceType, "r", "revealed piece is a rook");
  assert.equal(d.target, "e8", "target is black king on e8");
  assert.equal(d.targetPiece, "k", "target piece is a king");
  assert.equal(d.movedFrom, "e6", "king moved from e6");
  assert.equal(d.movedTo, "f6", "king moved to f6");
});

test("Kf6+ is NOT flagged when no sliding piece is behind the king", () => {
  // Same position but the rook is removed. Kf6 gives no check.
  const FEN_NO_ROOK = "4k3/8/4K3/8/8/8/8/8 w - - 0 1";
  const result = detectDiscovered(FEN_NO_ROOK, "e6", "f6", "w");
  assert.equal(result.length, 0, "no discovered attack without rook");
});
