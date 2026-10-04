// tests/make-api-evaluator.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { makeApiEvaluator } from "../lib/pgn-analysis.ts";

const okJson = (body: unknown, ok = true, status = 200) => ({
  ok,
  status,
  json: async () => body,
}) as unknown as Response;

test("makeApiEvaluator: happy path returns score/bestmove/secondScore", async () => {
  const fetchFn = (async () => okJson({
    bestmove: "e2e4",
    score: { type: "cp", value: 30 },
    secondScore: { type: "cp", value: 10 },
  })) as unknown as typeof fetch;

  const ev = makeApiEvaluator(fetchFn);
  const r = await ev("some-fen", 12);
  assert.equal(r.bestmove, "e2e4");
  assert.equal(r.score.type, "cp");
  assert.equal(r.score.value, 30);
  assert.equal(r.secondScore?.value, 10);
});

test("makeApiEvaluator: empty bestmove -> null", async () => {
  const fetchFn = (async () => okJson({
    bestmove: "",
    score: { type: "cp", value: 0 },
    secondScore: null,
  })) as unknown as typeof fetch;
  const r = await makeApiEvaluator(fetchFn)("fen", 12);
  assert.equal(r.bestmove, null);
});

test("makeApiEvaluator: bestmove '(none)' -> null", async () => {
  const fetchFn = (async () => okJson({
    bestmove: "(none)",
    score: { type: "cp", value: 0 },
    secondScore: null,
  })) as unknown as typeof fetch;
  const r = await makeApiEvaluator(fetchFn)("fen", 12);
  assert.equal(r.bestmove, null);
});

test("makeApiEvaluator: !res.ok throws with status", async () => {
  const fetchFn = (async () => okJson({ error: "boom" }, false, 500)) as unknown as typeof fetch;
  await assert.rejects(
    makeApiEvaluator(fetchFn)("fen", 12),
    /500/
  );
});

test("makeApiEvaluator: error payload surfaces message", async () => {
  const fetchFn = (async () => okJson({ error: "engine crashed" }, false, 500)) as unknown as typeof fetch;
  await assert.rejects(
    makeApiEvaluator(fetchFn)("fen", 12),
    /engine crashed/
  );
});

test("makeApiEvaluator: invalid score shape -> throws", async () => {
  const fetchFn = (async () => okJson({
    bestmove: "e2e4",
    score: { type: "cp" },  // missing value
    secondScore: null,
  })) as unknown as typeof fetch;
  await assert.rejects(makeApiEvaluator(fetchFn)("fen", 12));
});

test("makeApiEvaluator: mate value 0 -> throws", async () => {
  const fetchFn = (async () => okJson({
    bestmove: null,
    score: { type: "mate", value: 0 },
    secondScore: null,
  })) as unknown as typeof fetch;
  await assert.rejects(makeApiEvaluator(fetchFn)("fen", 12), /mate/i);
});

test("makeApiEvaluator: passes signal to fetch", async () => {
  const ac = new AbortController();
  let receivedSignal: AbortSignal | undefined;
  const fetchFn = (async (_url: string, init: RequestInit) => {
    receivedSignal = init?.signal ?? undefined;
    return okJson({
      bestmove: null,
      score: { type: "cp", value: 0 },
      secondScore: null,
    });
  }) as unknown as typeof fetch;

  await makeApiEvaluator(fetchFn)("fen", 12, ac.signal);
  assert.equal(receivedSignal, ac.signal);
});

test("makeApiEvaluator: AbortError passes through unwrapped", async () => {
  const fetchFn = (async () => {
    throw new DOMException("Aborted", "AbortError");
  }) as unknown as typeof fetch;
  await assert.rejects(
    makeApiEvaluator(fetchFn)("fen", 12),
    (err: Error) => err.name === "AbortError"
  );
});

test("makeApiEvaluator: missing secondScore -> null", async () => {
  const fetchFn = (async () => okJson({
    bestmove: null,
    score: { type: "cp", value: 0 },
  })) as unknown as typeof fetch;
  const r = await makeApiEvaluator(fetchFn)("fen", 12);
  assert.equal(r.secondScore, null);
});
