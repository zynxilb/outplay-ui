// tests/pgn-analysis-retry.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isAbortError,
  evalWithRetry,
  AnalysisError,
  type Evaluator,
  type PositionEval,
} from "../lib/pgn-analysis.ts";

const okEval: PositionEval = {
  score: { type: "cp", value: 0 },
  bestmove: null,
  secondScore: null,
};

// ---------- isAbortError ----------
test("isAbortError: DOMException AbortError -> true", () => {
  const e = new DOMException("Aborted", "AbortError");
  assert.equal(isAbortError(e), true);
});

test("isAbortError: Error with name=AbortError -> true", () => {
  const e = new Error("aborted");
  e.name = "AbortError";
  assert.equal(isAbortError(e), true);
});

test("isAbortError: plain object with name=AbortError -> true", () => {
  assert.equal(isAbortError({ name: "AbortError" }), true);
});

test("isAbortError: regular Error -> false", () => {
  assert.equal(isAbortError(new Error("boom")), false);
});

test("isAbortError: null / undefined / string -> false", () => {
  assert.equal(isAbortError(null), false);
  assert.equal(isAbortError(undefined), false);
  assert.equal(isAbortError("AbortError"), false);
});

// ---------- evalWithRetry ----------
test("evalWithRetry: success on first call (1 call)", async () => {
  let calls = 0;
  const ev: Evaluator = async () => { calls++; return okEval; };
  const r = await evalWithRetry(ev, "fen", 12);
  assert.equal(calls, 1);
  assert.equal(r, okEval);
});

test("evalWithRetry: fail once then succeed (2 calls)", async () => {
  let calls = 0;
  const ev: Evaluator = async () => {
    calls++;
    if (calls === 1) throw new Error("boom");
    return okEval;
  };
  const r = await evalWithRetry(ev, "fen", 12);
  assert.equal(calls, 2);
  assert.equal(r, okEval);
});

test("evalWithRetry: fail twice -> throws after exactly 2 calls", async () => {
  let calls = 0;
  const ev: Evaluator = async () => { calls++; throw new Error("boom"); };
  await assert.rejects(evalWithRetry(ev, "fen", 12), /boom/);
  assert.equal(calls, 2);
});

test("evalWithRetry: AbortError -> no retry (1 call)", async () => {
  let calls = 0;
  const ev: Evaluator = async () => {
    calls++;
    throw new DOMException("Aborted", "AbortError");
  };
  await assert.rejects(
    evalWithRetry(ev, "fen", 12),
    (err: Error) => err.name === "AbortError"
  );
  assert.equal(calls, 1);
});

test("evalWithRetry: signal aborted between attempts -> no retry", async () => {
  const ac = new AbortController();
  let calls = 0;
  const ev: Evaluator = async () => {
    calls++;
    ac.abort();
    throw new Error("boom");
  };
  await assert.rejects(evalWithRetry(ev, "fen", 12, ac.signal));
  assert.equal(calls, 1);
});

test("evalWithRetry: second failure becomes thrown error with cause", async () => {
  let calls = 0;
  const ev: Evaluator = async () => {
    calls++;
    throw new Error(calls === 1 ? "first" : "second");
  };
  await assert.rejects(
    evalWithRetry(ev, "fen", 12),
    (err: Error) => {
      assert.ok(err.cause instanceof Error);
      assert.equal(err.cause.message, "second");
      return true;
    }
  );
});

// ---------- AnalysisError ----------
test("AnalysisError: carries positionIndex and fen", () => {
  const e = new AnalysisError("msg", 3, "some-fen");
  assert.equal(e.message, "msg");
  assert.equal(e.positionIndex, 3);
  assert.equal(e.fen, "some-fen");
  assert.ok(e instanceof Error);
});


// ============ 6b.2b.2 ============
import { describePosition, makeAbortError, analyzePGN } from "../lib/pgn-analysis.ts";

// ---- describePosition ----
test("describePosition: index 0 -> start position", () => {
  assert.equal(describePosition(0, 5), "start position");
});

test("describePosition: middle index", () => {
  assert.equal(describePosition(2, 5), "after ply 2, before ply 3");
});

test("describePosition: last index -> final position", () => {
  assert.equal(describePosition(5, 5), "final position after ply 5");
});

// ---- makeAbortError ----
test("makeAbortError: signal.reason is Error -> returns it", () => {
  const ac = new AbortController();
  ac.abort(new Error("custom"));
  const e = makeAbortError(ac.signal);
  assert.equal(e.message, "custom");
});

test("makeAbortError: no reason -> DOMException AbortError", () => {
  const ac = new AbortController();
  ac.abort();
  const e = makeAbortError(ac.signal);
  assert.equal(e.name, "AbortError");
});

// ---- analyzePGN integration ----
test("analyzePGN: evaluator fails once then succeeds -> analysis completes", async () => {
  const pgn = `[White "A"]\n\n1. e4 e5 *\n`;
  let calls = 0;
  const ev: Evaluator = async () => {
    calls++;
    if (calls === 1) throw new Error("boom");
    return okEval;
  };
  const { moves } = await analyzePGN(pgn, { evaluator: ev, concurrency: 1 });
  assert.equal(moves.length, 2);
});

test("analyzePGN: evaluator fails twice -> AnalysisError with index+fen+cause", async () => {
  const pgn = `[White "A"]\n\n1. e4 e5 *\n`;
  const ev: Evaluator = async () => { throw new Error("perma"); };
  await assert.rejects(
    analyzePGN(pgn, { evaluator: ev, concurrency: 1 }),
    (err: Error) => {
      assert.equal(err.name, "AnalysisError");
      const e = err as Error & { positionIndex: number; fen: string; cause?: unknown };
      assert.equal(typeof e.positionIndex, "number");
      assert.equal(typeof e.fen, "string");
      assert.ok(e.cause instanceof Error);
      return true;
    }
  );
});

test("analyzePGN: abort before start -> AbortError, 0 calls, 0 progress", async () => {
  const ac = new AbortController();
  ac.abort();
  let calls = 0;
  let progressCalls = 0;
  const ev: Evaluator = async () => { calls++; return okEval; };
  await assert.rejects(
    analyzePGN(`[White "A"]\n\n1. e4 *\n`, {
      evaluator: ev,
      signal: ac.signal,
      onProgress: () => { progressCalls++; },
    }),
    (err: Error) => err.name === "AbortError"
  );
  assert.equal(calls, 0);
  assert.equal(progressCalls, 0);
});

test("analyzePGN: empty PGN + aborted signal -> AbortError", async () => {
  const ac = new AbortController();
  ac.abort();
  await assert.rejects(
    analyzePGN(`[White "A"]\n\n*\n`, {
      evaluator: async () => okEval,
      signal: ac.signal,
    }),
    (err: Error) => err.name === "AbortError"
  );
});

test("analyzePGN: evaluator throws AbortError -> passes through unwrapped", async () => {
  const pgn = `[White "A"]\n\n1. e4 e5 *\n`;
  const ev: Evaluator = async () => {
    throw new DOMException("Aborted", "AbortError");
  };
  await assert.rejects(
    analyzePGN(pgn, { evaluator: ev, concurrency: 1 }),
    (err: Error) => err.name === "AbortError" && !(err.name === "AnalysisError")
  );
});

test("analyzePGN: TypeError after signal aborted -> AbortError, not AnalysisError", async () => {
  const ac = new AbortController();
  const pgn = `[White "A"]\n\n1. e4 e5 *\n`;
  const ev: Evaluator = async () => {
    ac.abort();
    throw new TypeError("fetch failed");
  };
  await assert.rejects(
    analyzePGN(pgn, { evaluator: ev, concurrency: 1, signal: ac.signal }),
    (err: Error) => err.name === "AbortError"
  );
});

test("analyzePGN: evaluator throws AnalysisError -> not re-wrapped", async () => {
  const pgn = `[White "A"]\n\n1. e4 e5 *\n`;
  const original = new AnalysisError("inner", 99, "fake-fen");
  const ev: Evaluator = async () => { throw original; };
  await assert.rejects(
    analyzePGN(pgn, { evaluator: ev, concurrency: 1 }),
    (err: Error) => {
      assert.equal(err.name, "AnalysisError");
      assert.equal((err as AnalysisError).positionIndex, 99);
      return true;
    }
  );
});

test("analyzePGN: AnalysisError.positionIndex uses original FEN index", async () => {
  // 2 moves, terminal after ply 2. FENs 0..2. nonTerminal = [0,1].
  const pgn = `[White "A"]\n\n1. f3 e5 2. g4 Qh4# 0-1\n`;
  // Wait: that's 4 plies. Let's simplify: force failure at position index 1
  let callIdx = 0;
  const ev: Evaluator = async () => {
    callIdx++;
    if (callIdx === 2) throw new Error("kill");
    return okEval;
  };
  await assert.rejects(
    analyzePGN(pgn, { evaluator: ev, concurrency: 1 }),
    (err: Error) => {
      const e = err as AnalysisError;
      assert.equal(e.name, "AnalysisError");
      assert.equal(e.positionIndex, 1); // second FEN evaluated (index 1)
      return true;
    }
  );
});
