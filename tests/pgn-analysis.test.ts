// tests/pgn-analysis.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { Chess } from "chess.js";
import { buildPositions } from "../lib/pgn-analysis.ts";

const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

test("buildPositions: legal game returns N+1 FENs, first = STARTING_FEN", () => {
  const fens = buildPositions(["e4", "e5", "Nf3"]);
  assert.equal(fens.length, 4);
  assert.equal(fens[0], STARTING_FEN);
});

test("buildPositions: custom start FEN (black to move)", () => {
  const customFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1";
  assert.throws(
    () => buildPositions(["e4"], customFen),
    (err: Error) => err.message.includes("ply 1") && err.message.includes("e4")
  );
});

test("buildPositions: illegal move throws with ply 2 and SAN", () => {
  assert.throws(
    () => buildPositions(["e4", "e4"]),
    (err: Error) => err.message.includes("ply 2") && err.message.includes("e4")
  );
});

test("buildPositions: checkmate terminal position", () => {
  const fens = buildPositions(["f3", "e5", "g4", "Qh4#"]);
  assert.equal(fens.length, 5);
  const final = new Chess(fens[4]);
  assert.equal(final.isCheckmate(), true);
});

test("buildPositions: invalid start FEN throws a clear error", () => {
  assert.throws(
    () => buildPositions(["e4"], "not a fen"),
    (err: Error) => err.message.toLowerCase().includes("invalid") || err.message.toLowerCase().includes("fen")
  );
});
