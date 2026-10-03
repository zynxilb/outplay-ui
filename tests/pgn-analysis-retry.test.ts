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
