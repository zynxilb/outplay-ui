// tests/position-at-ply.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { Chess } from "chess.js";
import { positionAtPly } from "../lib/position-at-ply.ts";

const DEFAULT_START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const same = (a: string | null, b: string) =>
  a !== null && new Chess(a).fen() === new Chess(b).fen();

test("positionAtPly: ply 0 returns start FEN", () => {
  const f = positionAtPly(["e4", "e5"], 0);
  assert.ok(same(f, DEFAULT_START));
});

test("positionAtPly: ply 0 with empty sans returns start FEN", () => {
  const f = positionAtPly([], 0);
  assert.ok(same(f, DEFAULT_START));
});

test("positionAtPly: middle ply", () => {
  const f = positionAtPly(["e4", "e5", "Nf3"], 2);
  // after 1.e4 e5 -> black to move
  const c = new Chess(f!);
  assert.equal(c.turn(), "w");
});

test("positionAtPly: last ply", () => {
  const f = positionAtPly(["e4", "e5", "Nf3"], 3);
  const c = new Chess(f!);
  assert.equal(c.turn(), "b");
});

test("positionAtPly: negative ply -> null", () => {
  assert.equal(positionAtPly(["e4"], -1), null);
});

test("positionAtPly: ply > length -> null", () => {
  assert.equal(positionAtPly(["e4"], 5), null);
});

test("positionAtPly: NaN -> null", () => {
  assert.equal(positionAtPly(["e4"], NaN), null);
});

test("positionAtPly: non-integer -> null", () => {
  assert.equal(positionAtPly(["e4"], 1.5), null);
});

test("positionAtPly: custom start FEN", () => {
  const custom = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
  const f = positionAtPly(["e5"], 0, custom);
  assert.ok(same(f, custom));
});

test("positionAtPly: illegal SAN -> null", () => {
  assert.equal(positionAtPly(["e4", "e4"], 2), null);
});

test("positionAtPly: multi-ply fixture — ply 0, mid, last are all valid", () => {
  // Simplified legal sequence (32 plies ending with black's 16th move)
  const sans = [
    "e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6",
    "O-O", "Be7", "Re1", "b5", "Bb3", "d6", "c3", "O-O",
    "h3", "Nb8", "d4", "Nbd7", "Nbd2", "Bb7", "Bc2", "Re8",
    "Nf1", "Bf8", "Ng3", "g6", "b3", "Bg7", "d5", "c6",
  ];

  const f0 = positionAtPly(sans, 0);
  assert.ok(same(f0, DEFAULT_START));

  const fMid = positionAtPly(sans, 16);
  assert.ok(fMid !== null);
  assert.doesNotThrow(() => new Chess(fMid!));

  const fLast = positionAtPly(sans, sans.length);
  assert.ok(fLast !== null);
  assert.doesNotThrow(() => new Chess(fLast!));
});
