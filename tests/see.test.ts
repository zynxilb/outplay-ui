import { test } from "node:test";
import assert from "node:assert/strict";
import { Chess } from "chess.js";
import { see, sacrificeValue } from "../lib/see.ts";

test("SEE: undefended pawn can be captured (+1)", () => {
  // White Pe4, black pd5 undefended.
  const c = new Chess("4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1");
  assert.equal(see(c, "d5" as any, "w"), 1);
});

test("SEE: knight takes pawn defended by pawn (-2)", () => {
  // White Nf3, black pe5 defended by pd6.
  const c = new Chess("4k3/8/3p4/4p3/8/5N2/8/4K3 w - - 0 1");
  assert.equal(see(c, "e5" as any, "w"), -2);
});

test("SEE: queen takes pawn defended by pawn (-8)", () => {
  // White Qd5, black pe5 defended by pd6. Qxe5, dxe5 → -9+1 = -8.
  const c = new Chess("4k3/8/3p4/3Qp3/8/8/8/4K3 w - - 0 1");
  assert.equal(see(c, "e5" as any, "w"), -8);
});

test("SEE: empty square returns 0", () => {
  const c = new Chess();
  assert.equal(see(c, "e4" as any, "w"), 0);
});

test("sacrificeValue: undefended queen = full value", () => {
  // White Rh1 attacks black Qh5 (undefended). Rh1xh5 → +9.
  const c = new Chess("4k3/8/8/7q/8/8/8/4K2R w - - 0 1");
  assert.equal(sacrificeValue(c, "h5" as any), 9);
});

test("sacrificeValue: queen defended by rook = less than 9", () => {
  // Black Qh5 defended by Rh8. White Rh1 attacks h5.
  // Rh1xh5, Rxh5, Rxh5 → white wins Q(9) loses R(5), black wins R(5) loses Q(9)
  // Net for white: 9 - 5 + 5 = 9, so sacrificeValue should be 9.
  // Simpler test: no recapture available on second round.
  // Actually use: black Qh5 defended by black pawn g6.
  const c = new Chess("4k3/8/6p1/7q/8/8/8/4K2R w - - 0 1");
  const v = sacrificeValue(c, "h5" as any);
  // Rh1xh5 → +9, g6xh5 → white loses R(5), net for white = 4.
  // sacrificeValue = what opponent (white) can win = 9 - 5 = 4.
  assert.equal(v, 4);
});
