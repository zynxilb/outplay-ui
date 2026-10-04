// tests/pgn-errors-ar.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { toArabicError } from "../lib/pgn-errors-ar.ts";
import { AnalysisError } from "../lib/pgn-analysis.ts";
import { InvalidFenError, IllegalMoveError, NetworkError } from "../lib/pgn-errors.ts";

test("toArabicError: AbortError -> Arabic abort message", () => {
  const e = new DOMException("original-english", "AbortError");
  const msg = toArabicError(e);
  assert.ok(!msg.includes("original-english"));
  assert.ok(msg.length > 0);
});

test("toArabicError: AnalysisError positionIndex 0 -> start position", () => {
  const e = new AnalysisError("english", 0, "fen");
  const msg = toArabicError(e);
  assert.ok(!msg.includes("english"));
  assert.ok(msg.includes("الوضع") || msg.includes("الابتدائي") || msg.includes("بداية"));
});

test("toArabicError: AnalysisError positionIndex 3 -> mentions 3", () => {
  const e = new AnalysisError("english", 3, "fen");
  const msg = toArabicError(e);
  assert.ok(!msg.includes("english"));
  assert.ok(msg.includes("3"));
});

test("toArabicError: InvalidFenError -> Arabic fen message", () => {
  const e = new InvalidFenError("not a fen");
  const msg = toArabicError(e);
  assert.ok(!msg.includes("not a fen"));
  assert.ok(msg.length > 0);
});

test("toArabicError: IllegalMoveError ply 2 -> mentions 2 and san", () => {
  const e = new IllegalMoveError(2, "e4");
  const msg = toArabicError(e);
  assert.ok(!msg.includes("Illegal move"));
  assert.ok(msg.includes("2"));
  assert.ok(msg.includes("e4"));
});

test("toArabicError: unknown error -> generic Arabic message", () => {
  const msg = toArabicError(new Error("something in English"));
  assert.ok(!msg.includes("something in English"));
  assert.ok(!msg.includes("Error"));
  assert.ok(msg.length > 0);
});

test("toArabicError: NetworkError -> Arabic connection message", () => {
  const msg = toArabicError(new NetworkError(new Error("boom")));
  assert.ok(msg.includes("الاتصال") || msg.includes("مشكلة"));
});

test("toArabicError: TypeError (bug, not network) -> generic, not network", () => {
  const msg = toArabicError(new TypeError("undefined.foo"));
  assert.ok(!msg.includes("الاتصال"));
  assert.ok(msg.length > 0);
});

test("toArabicError: null / undefined -> generic", () => {
  assert.ok(toArabicError(null).length > 0);
  assert.ok(toArabicError(undefined).length > 0);
});
