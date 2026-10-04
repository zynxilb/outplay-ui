// tests/to-classified-moves.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { toClassifiedMoves, analyzePGN, type Evaluator } from "../lib/pgn-analysis.ts";

const cpEval = (cp: number) => ({
  score: { type: "cp" as const, value: cp },
  bestmove: null,
  secondScore: null,
});

const fakeEval: Evaluator = async () => cpEval(0);

test("toClassifiedMoves: empty array -> empty array", () => {
  assert.deepEqual(toClassifiedMoves([]), []);
});

test("toClassifiedMoves: single white move has from/to/color=w", async () => {
  const pgn = `[White "A"]\n\n1. e4 *\n`;
  const { moves } = await analyzePGN(pgn, { evaluator: fakeEval, concurrency: 1 });
  const converted = toClassifiedMoves(moves);
  assert.equal(converted.length, 1);
  assert.equal(converted[0].from, "e2");
  assert.equal(converted[0].to, "e4");
  assert.equal(converted[0].color, "w");
});

test("toClassifiedMoves: single black move has color=b", async () => {
  const pgn = `[White "A"]\n\n1. e4 e5 *\n`;
  const { moves } = await analyzePGN(pgn, { evaluator: fakeEval, concurrency: 1 });
  const converted = toClassifiedMoves(moves);
  assert.equal(converted.length, 2);
  assert.equal(converted[1].color, "b");
  assert.equal(converted[1].from, "e7");
  assert.equal(converted[1].to, "e5");
});

test("toClassifiedMoves: preserves ply, san, classification, evals", async () => {
  const pgn = `[White "A"]\n\n1. e4 e5 *\n`;
  const { moves } = await analyzePGN(pgn, { evaluator: fakeEval, concurrency: 1 });
  const converted = toClassifiedMoves(moves);
  assert.equal(converted[0].ply, moves[0].ply);
  assert.equal(converted[0].san, moves[0].san);
  assert.equal(converted[0].classification, moves[0].classification);
  assert.equal(typeof converted[0].evalBefore, "number");
  assert.equal(typeof converted[0].evalAfter, "number");
});

test("toClassifiedMoves: motifs is empty array, motifArrows undefined", async () => {
  const pgn = `[White "A"]\n\n1. e4 *\n`;
  const { moves } = await analyzePGN(pgn, { evaluator: fakeEval, concurrency: 1 });
  const converted = toClassifiedMoves(moves);
  assert.deepEqual(converted[0].motifs, []);
  assert.equal(converted[0].motifArrows, undefined);
});

test("toClassifiedMoves: throws if classification is missing", () => {
  const bad = [{
    ply: 1, san: "e4",
    fenBefore: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    fenAfter: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
    evalBefore: { score: { type: "cp" as const, value: 0 }, bestmove: null, secondScore: null },
    evalAfter: { score: { type: "cp" as const, value: 0 }, bestmove: null, secondScore: null },
    // classification missing on purpose
  } as any];
  assert.throws(() => toClassifiedMoves(bad), /classification/i);
});
