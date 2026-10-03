// tests/pgn-analysis-helpers.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreToCp, toUci, computeIsBest } from "../lib/pgn-analysis.ts";

const STARTING = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const WHITE_CASTLE = "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1";
const PROMO = "8/P7/8/8/8/8/8/K6k w - - 0 1";
const EP = "rnbqkbnr/ppp1p1pp/8/3pPp2/8/8/PPPP1PPP/RNBQKBNR w KQkq f6 0 3";

test("scoreToCp: cp passthrough", () => {
  assert.equal(scoreToCp({ type: "cp", value: 50 }), 50);
  assert.equal(scoreToCp({ type: "cp", value: -120 }), -120);
});

test("scoreToCp: mate positive -> +10000", () => {
  assert.equal(scoreToCp({ type: "mate", value: 3 }), 10000);
});

test("scoreToCp: mate negative -> -10000", () => {
  assert.equal(scoreToCp({ type: "mate", value: -2 }), -10000);
});

test("scoreToCp: mate 0 throws", () => {
  assert.throws(
    () => scoreToCp({ type: "mate", value: 0 }),
    (err: Error) => /mate/i.test(err.message)
  );
});

test("toUci: normal move", () => {
  assert.equal(toUci({ from: "e2", to: "e4" }), "e2e4");
});

test("toUci: promotion", () => {
  assert.equal(toUci({ from: "e7", to: "e8", promotion: "q" }), "e7e8q");
});

test("computeIsBest: null / empty / (none) -> false", () => {
  assert.equal(computeIsBest("e4", STARTING, null), false);
  assert.equal(computeIsBest("e4", STARTING, ""), false);
  assert.equal(computeIsBest("e4", STARTING, "(none)"), false);
});

test("computeIsBest: matches plain move", () => {
  assert.equal(computeIsBest("e4", STARTING, "e2e4"), true);
  assert.equal(computeIsBest("e4", STARTING, "d2d4"), false);
});

test("computeIsBest: castling maps to e1g1", () => {
  assert.equal(computeIsBest("O-O", WHITE_CASTLE, "e1g1"), true);
});

test("computeIsBest: promotion maps to a7a8q", () => {
  assert.equal(computeIsBest("a8=Q", PROMO, "a7a8q"), true);
});

test("computeIsBest: en passant maps to e5f6", () => {
  assert.equal(computeIsBest("exf6", EP, "e5f6"), true);
});

test("computeIsBest: illegal SAN -> false (no throw)", () => {
  assert.equal(computeIsBest("Qh5", STARTING, "d2d4"), false);
});


test("computeIsBest: black castling kingside (e8g8)", () => {
  const fen = "r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1";
  assert.equal(computeIsBest("O-O", fen, "e8g8"), true);
});

test("computeIsBest: white castling queenside (e1c1)", () => {
  const fen = "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1";
  assert.equal(computeIsBest("O-O-O", fen, "e1c1"), true);
});

test("computeIsBest: promotion to knight", () => {
  const fen = "8/P7/8/8/8/8/8/K6k w - - 0 1";
  assert.equal(computeIsBest("a8=N", fen, "a7a8n"), true);
});

test("computeIsBest: capture-promotion", () => {
  const fen = "1r6/P7/8/8/8/8/8/K6k w - - 0 1";
  assert.equal(computeIsBest("axb8=Q", fen, "a7b8q"), true);
});

test("computeIsBest: uppercase bestmove UCI still matches", () => {
  assert.equal(computeIsBest("e4", STARTING, "E2E4"), true);
});
