// tests/pgn-errors.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { InvalidFenError, IllegalMoveError } from "../lib/pgn-errors.ts";
import { buildPositions } from "../lib/pgn-analysis.ts";

test("InvalidFenError: is instanceof Error", () => {
  const e = new InvalidFenError("some-fen");
  assert.ok(e instanceof Error);
});

test("InvalidFenError: has correct name, fen field, and message", () => {
  const e = new InvalidFenError("not a fen");
  assert.equal(e.name, "InvalidFenError");
  assert.equal(e.fen, "not a fen");
  assert.ok(e.message.includes("not a fen"));
  assert.ok(/invalid|fen/i.test(e.message));
});

test("IllegalMoveError: is instanceof Error", () => {
  const e = new IllegalMoveError(2, "e4");
  assert.ok(e instanceof Error);
});

test("IllegalMoveError: has correct name, ply, san, and message", () => {
  const e = new IllegalMoveError(2, "e4");
  assert.equal(e.name, "IllegalMoveError");
  assert.equal(e.ply, 2);
  assert.equal(e.san, "e4");
  assert.ok(e.message.includes("ply 2"));
  assert.ok(e.message.includes("e4"));
});

test("IllegalMoveError: optional reason appears in message", () => {
  const e = new IllegalMoveError(3, "Qd8", "no queen");
  assert.ok(e.message.includes("no queen"));
});

test("buildPositions: invalid start FEN throws InvalidFenError", () => {
  assert.throws(
    () => buildPositions(["e4"], "not a fen"),
    (err: Error) => err instanceof InvalidFenError
  );
});

test("buildPositions: illegal move throws IllegalMoveError with ply+san", () => {
  assert.throws(
    () => buildPositions(["e4", "e4"]),
    (err: Error) => {
      assert.ok(err instanceof IllegalMoveError);
      const e = err as IllegalMoveError;
      assert.equal(e.ply, 2);
      assert.equal(e.san, "e4");
      return true;
    }
  );
});
