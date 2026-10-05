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

test("positionAtPly: 32-ply fixture — ply 0, 15, last", () => {
  const sans = [
    "e4", "e5", "Bc4", "f5", "exf5", "Nf6", "Nc3", "d5",
    "Nxd5", "Bc5", "Nxf6+", "Qxf6", "d3", "Bxf5", "Nf3", "Bg4",
    "Bd5", "c6", "Be4", "Nd7", "O-O", "h6", "c3", "O-O-O",
    "b4", "Bb6", "a4", "a6", "Qb3", "Bxf3", "Bxf3", "g5",
  ];
  const f0 = positionAtPly(sans, 0);
  assert.ok(same(f0, DEFAULT_START));

  const f15 = positionAtPly(sans, 15);
  assert.ok(f15 !== null);
  const c15 = new Chess(f15!);
  assert.equal(c15.turn(), "w");

  const fLast = positionAtPly(sans, sans.length);
  assert.ok(fLast !== null);
  const cLast = new Chess(fLast!);
  assert.equal(cLast.turn(), "w"); // after 32 plies, white to move
});
