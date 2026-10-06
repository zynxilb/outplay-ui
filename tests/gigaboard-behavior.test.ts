// tests/gigaboard-behavior.test.ts
//
// Characterization tests for gigaboard's BoardModel behavior in Node.
//
// These are NOT red/green tests — they document observed behavior of the
// library we depend on. If they fail after a gigaboard upgrade, it means
// the library's contract changed and our design in app/play/page.tsx
// (specifically the `viewOnly` guard against tryMove-truncates-future)
// must be re-evaluated.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createBoardModel,
  createGigachessAdapter,
  unpackMove,
} from "gigaboard/core";

const alg = (sq: string): number => {
  const f = sq.charCodeAt(0) - 97;
  const r = sq.charCodeAt(1) - 49;
  return f + r * 8;
};

// 1.e4 e5 2.Nf3 Nc6 3.Bb5 — 5 plies, fixed fixture.
const MOVES: ReadonlyArray<readonly [string, string]> = [
  ["e2", "e4"],
  ["e7", "e5"],
  ["g1", "f3"],
  ["b8", "c6"],
  ["f1", "b5"],
];

function makeGameWith5Moves() {
  const engine = createGigachessAdapter();
  const model = createBoardModel(engine);
  for (const [from, to] of MOVES) {
    const r = model.tryMove(alg(from), alg(to));
    if (!r) throw new Error(`fixture setup failed at ${from}-${to}`);
  }
  return model;
}

// ─── H1: goto does not destroy history ────────────────────────────────

test("H1: goto does not destroy history (documents library behavior)", () => {
  const model = makeGameWith5Moves();

  const before = model.getSnapshot();
  assert.equal(before.historyPly, 5, "precondition: 5 plies played");
  assert.equal(before.historyLength, 5, "precondition: history length is 5");

  model.goto(2);

  const after = model.getSnapshot();
  assert.equal(after.historyPly, 2, "historyPly moved back to 2");
  assert.equal(after.historyLength, 5, "historyLength preserved (not truncated)");

  // Fixture check: we're actually at the position after 1.e4 e5.
  // BoardSnapshot has no `fen` field, so we verify via turn + lastMove.
  assert.equal(after.turn, 0, "white to move after 2 plies");
  assert.ok(after.lastMove !== null, "lastMove present");
  const { from, to } = unpackMove(after.lastMove);
  assert.equal(from, alg("e7"), "lastMove.from is e7");
  assert.equal(to, alg("e5"), "lastMove.to is e5");
});

// ─── H2: tryMove after goto truncates the future ─────────────────────
//
// THIS IS THE DANGEROUS BEHAVIOR that app/play/page.tsx guards against
// with `viewOnly={isPreview}`. If this test ever fails (tryMove no longer
// truncates), we can reconsider the guard. Until then, viewOnly must stay.

test("H2: tryMove after goto truncates the future (documents library behavior)", () => {
  const model = makeGameWith5Moves();
  assert.equal(model.getSnapshot().historyLength, 5);

  model.goto(2);

  // From the ply-2 position (after 1.e4 e5), white plays 2.Nf3.
  const r = model.tryMove(alg("g1"), alg("f3"));
  assert.ok(r, "legal move from ply-2 position was accepted");

  const after = model.getSnapshot();
  assert.equal(after.historyPly, 3, "advanced to ply 3");
  assert.equal(
    after.historyLength,
    3,
    "future plies 3-5 were truncated — this is the destructive behavior"
  );

  // The original ply-5 position is unrecoverable: goto(5) clamps to 3.
  model.goto(5);
  assert.equal(
    model.getSnapshot().historyPly,
    3,
    "goto beyond historyLength clamps to end — original future is gone"
  );
});

// ─── H3: goto does not clear user arrows ──────────────────────────────

test("H3: goto does not clear user arrows (documents library behavior)", () => {
  const model = makeGameWith5Moves();

  // Start with a user-drawn arrow (not managed).
  model.addArrow({
    from: alg("e2"),
    to: alg("e4"),
    color: "#81B64C",
  } as never);

  const withArrow = model.getSnapshot();
  assert.equal(withArrow.arrows.length, 1, "user arrow was added");
  // Sanity: addArrow should not mark arrows as managed.
  assert.notEqual(
    (withArrow.arrows[0] as { managed?: boolean }).managed,
    true,
    "addArrow does not mark arrow as managed"
  );

  model.goto(1);

  const after = model.getSnapshot();
  assert.equal(after.arrows.length, 1, "user arrow survived goto");
});
