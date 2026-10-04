// tests/pgn-analysis-classify.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  analyzePGN,
  isBestMove,
  type Evaluator,
  type PositionEval,
} from "../lib/pgn-analysis.ts";

const cpEval = (cp: number): PositionEval => ({
  score: { type: "cp", value: cp },
  bestmove: null,
  secondScore: null,
});

const mateEval = (value: number): PositionEval => ({
  score: { type: "mate", value },
  bestmove: null,
  secondScore: null,
});

// ---------- isBestMove ----------
test("isBestMove: engine bestmove matches -> true", () => {
  const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  assert.equal(isBestMove("e4", fen, "e2e4", cpEval(30), "w"), true);
});

test("isBestMove: engine bestmove differs, no mate -> false", () => {
  const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  assert.equal(isBestMove("e4", fen, "d2d4", cpEval(30), "w"), false);
});

test("isBestMove: mate for white -> true even without bestmove match", () => {
  const fen = "6k1/5ppp/8/8/8/8/8/R6K w - - 0 1";
  assert.equal(isBestMove("Ra8#", fen, null, mateEval(10000), "w"), true);
});

test("isBestMove: mate for black -> true when mover=black", () => {
  const fen = "r6k/8/8/8/8/8/5PPP/6K1 b - - 0 1";
  assert.equal(isBestMove("Ra8#", fen, null, mateEval(10000), "b"), true);
});

test("isBestMove: mate against mover -> false", () => {
  const fen = "6k1/5ppp/8/8/8/8/8/R6K w - - 0 1";
  assert.equal(isBestMove("Ra8#", fen, null, mateEval(-10000), "w"), false);
});

// ---------- analyzePGN + classification ----------
test("analyzePGN: simple game populates classification for every move", async () => {
  const pgn = `[White "A"]\n\n1. e4 e5 *\n`;
  const ev: Evaluator = async () => cpEval(0);
  const { moves } = await analyzePGN(pgn, { evaluator: ev, concurrency: 1 });
  assert.equal(moves.length, 2);
  assert.equal(typeof moves[0].classification, "string");
  assert.equal(typeof moves[1].classification, "string");
});

test("analyzePGN: checkmate move classifies as Best", async () => {
  const pgn = `[White "A"]\n\n1. f3 e5 2. g4 Qh4# 0-1\n`;
  const ev: Evaluator = async () => cpEval(0);
  const { moves } = await analyzePGN(pgn, { evaluator: ev, concurrency: 1 });
  assert.equal(moves[3].classification, "Best");
});

test("analyzePGN: perspective symmetry (white improves == black improves)", async () => {
  const whitePgn = `[White "A"]\n\n1. e4 *\n`;
  let wc = 0;
  const whiteEv: Evaluator = async () => {
    wc++;
    return wc === 1 ? cpEval(0) : cpEval(30);
  };
  const w = await analyzePGN(whitePgn, { evaluator: whiteEv, concurrency: 1 });

  const blackPgn = `[SetUp "1"]\n[FEN "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1"]\n\n1... e5 *\n`;
  let bc = 0;
  const blackEv: Evaluator = async () => {
    bc++;
    return bc === 1 ? cpEval(30) : cpEval(0);
  };
  const b = await analyzePGN(blackPgn, { evaluator: blackEv, concurrency: 1 });

  assert.equal(w.moves[0].classification, b.moves[0].classification);
});

test("analyzePGN: ply 1 not Miss (prevOppEpLoss is null)", async () => {
  const pgn = `[White "A"]\n\n1. f3 *\n`;
  let call = 0;
  const ev: Evaluator = async () => {
    call++;
    return call === 1 ? cpEval(800) : cpEval(-800);
  };
  const { moves } = await analyzePGN(pgn, { evaluator: ev, concurrency: 1 });
  assert.notEqual(moves[0].classification, "Miss");
});
