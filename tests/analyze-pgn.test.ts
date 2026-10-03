// tests/analyze-pgn.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { Chess } from "chess.js";
import {
  analyzePGN,
  startFenFromHeaders,
  type Evaluator,
} from "../lib/pgn-analysis.ts";

const fakeEval = (cp: number): Evaluator =>
  async () => ({ score: { type: "cp", value: cp }, bestmove: null, secondScore: null });

const recordingEval = (): { eval: Evaluator; calls: string[] } => {
  const calls: string[] = [];
  const evalFn: Evaluator = async (fen) => {
    calls.push(fen);
    return { score: { type: "cp", value: 0 }, bestmove: null, secondScore: null };
  };
  return { eval: evalFn, calls };
};

// ---------- startFenFromHeaders ----------
test("startFenFromHeaders: SetUp 1 + FEN returns FEN", () => {
  const pgn = `[SetUp "1"]\n[FEN "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1"]\n\n1. O-O\n`;
  assert.equal(startFenFromHeaders(pgn), "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
});

test("startFenFromHeaders: FEN without SetUp -> undefined", () => {
  const pgn = `[FEN "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1"]\n\n1. O-O\n`;
  assert.equal(startFenFromHeaders(pgn), undefined);
});

test("startFenFromHeaders: SetUp without FEN -> undefined", () => {
  const pgn = `[SetUp "1"]\n\n1. O-O\n`;
  assert.equal(startFenFromHeaders(pgn), undefined);
});

test("startFenFromHeaders: SetUp not 1 -> undefined", () => {
  const pgn = `[SetUp "0"]\n[FEN "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1"]\n\n1. O-O\n`;
  assert.equal(startFenFromHeaders(pgn), undefined);
});

// ---------- analyzePGN: basic ----------
test("analyzePGN: 2-move game returns 2 MoveAnalysis", async () => {
  const pgn = `[White "A"]\n[Black "B"]\n\n1. e4 e5 1-0\n`;
  const { headers, moves } = await analyzePGN(pgn, { evaluator: fakeEval(0) });
  assert.equal(moves.length, 2);
  assert.equal(moves[0].ply, 1);
  assert.equal(moves[0].san, "e4");
  assert.equal(moves[1].ply, 2);
  assert.equal(moves[1].san, "e5");
  assert.equal(headers.white, "A");
  assert.equal(headers.black, "B");
});

test("analyzePGN: evaluator called N+1 times, all unique", async () => {
  const pgn = `[White "A"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bb5 *\n`;
  const { eval: evalFn, calls } = recordingEval();
  await analyzePGN(pgn, { evaluator: evalFn });
  assert.equal(calls.length, 6);
  assert.equal(new Set(calls).size, 6);
});

// ---------- analyzePGN: terminal ----------
test("analyzePGN: Fool's Mate -> last evalAfter is mate for black (-10000)", async () => {
  const pgn = `[White "A"]\n\n1. f3 e5 2. g4 Qh4# 0-1\n`;
  const { eval: evalFn, calls } = recordingEval();
  const { moves } = await analyzePGN(pgn, { evaluator: evalFn });
  assert.equal(moves.length, 4);
  assert.equal(calls.length, 4);
  assert.equal(moves[3].evalAfter.score.type, "mate");
  assert.equal(moves[3].evalAfter.score.value, -10000);
});

test("analyzePGN: white mates via Ra8# -> evalAfter +10000", async () => {
  const pgn = `[SetUp "1"]\n[FEN "6k1/5ppp/8/8/8/8/8/R6K w - - 0 1"]\n\n1. Ra8# 1-0\n`;
  const { eval: evalFn, calls } = recordingEval();
  const { moves } = await analyzePGN(pgn, { evaluator: evalFn });
  assert.equal(moves.length, 1);
  assert.equal(calls.length, 1);
  assert.equal(moves[0].evalAfter.score.type, "mate");
  assert.equal(moves[0].evalAfter.score.value, 10000);
});

test("analyzePGN: stalemate terminal evalAfter is cp 0", async () => {
  const pgn = `[SetUp "1"]\n[FEN "k7/2K5/8/8/8/8/8/1Q6 w - - 0 1"]\n\n1. Qg1 1/2-1/2\n`;
  const { eval: evalFn } = recordingEval();
  const { moves } = await analyzePGN(pgn, { evaluator: evalFn });
  assert.equal(moves.length, 1);
  assert.equal(moves[0].evalAfter.score.type, "cp");
  assert.equal(moves[0].evalAfter.score.value, 0);
});

// ---------- analyzePGN: empty ----------
test("analyzePGN: empty PGN returns headers and no calls", async () => {
  const pgn = `[White "A"]\n[Black "B"]\n\n*\n`;
  let called = 0;
  const evalFn: Evaluator = async () => {
    called++;
    return { score: { type: "cp", value: 0 }, bestmove: null, secondScore: null };
  };
  const { headers, moves } = await analyzePGN(pgn, { evaluator: evalFn });
  assert.equal(moves.length, 0);
  assert.equal(headers.white, "A");
  assert.equal(called, 0);
});

// ---------- analyzePGN: progress ----------
test("analyzePGN: onProgress non-decreasing, (total,total) exactly once at end", async () => {
  const pgn = `[White "A"]\n\n1. e4 e5 2. Nf3 *\n`;
  const calls: Array<[number, number]> = [];
  await analyzePGN(pgn, {
    evaluator: fakeEval(0),
    onProgress: (done, total) => calls.push([done, total]),
  });
  for (let i = 1; i < calls.length; i++) {
    assert.ok(calls[i][0] >= calls[i - 1][0], "done decreased");
  }
  const [lastDone, lastTotal] = calls[calls.length - 1];
  assert.equal(lastDone, 4);
  assert.equal(lastTotal, 4);
  const finalHits = calls.filter(([d, t]) => d === 4 && t === 4);
  assert.equal(finalHits.length, 1);
});

test("analyzePGN: terminal FENs counted in progress total", async () => {
  const pgn = `[White "A"]\n\n1. f3 e5 2. g4 Qh4# 0-1\n`;
  const calls: Array<[number, number]> = [];
  await analyzePGN(pgn, {
    evaluator: fakeEval(0),
    onProgress: (done, total) => calls.push([done, total]),
  });
  const [lastDone, lastTotal] = calls[calls.length - 1];
  assert.equal(lastDone, 5);
  assert.equal(lastTotal, 5);
});

// ---------- analyzePGN: reference sharing ----------
test("analyzePGN: evalAfter[n] === evalBefore[n+1] by reference", async () => {
  const pgn = `[White "A"]\n\n1. e4 e5 2. Nf3 *\n`;
  const { moves } = await analyzePGN(pgn, { evaluator: fakeEval(50) });
  assert.equal(moves.length, 3);
  assert.strictEqual(moves[0].evalAfter, moves[1].evalBefore);
  assert.strictEqual(moves[1].evalAfter, moves[2].evalBefore);
});

// ---------- analyzePGN: callback throwing ----------
test("analyzePGN: onProgress throwing doesn't stop analysis", async () => {
  const pgn = `[White "A"]\n\n1. e4 e5 *\n`;
  const { moves } = await analyzePGN(pgn, {
    evaluator: fakeEval(0),
    onProgress: () => { throw new Error("callback boom"); },
  });
  assert.equal(moves.length, 2);
});

// ---------- analyzePGN: custom FEN ----------
test("analyzePGN: custom FEN from headers is used as start", async () => {
  const pgn = `[SetUp "1"]\n[FEN "6k1/5ppp/8/8/8/8/8/R6K w - - 0 1"]\n\n1. Ra8# 1-0\n`;
  const { eval: evalFn, calls } = recordingEval();
  await analyzePGN(pgn, { evaluator: evalFn });
  assert.equal(calls.length, 1);
  const expected = new Chess("6k1/5ppp/8/8/8/8/8/R6K w - - 0 1").fen();
  assert.equal(calls[0], expected);
});
