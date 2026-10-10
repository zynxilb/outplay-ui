// tests/sacrifice-detector.test.ts
// Run: node --test tests/sacrifice-detector.test.ts

import { test } from "node:test";
import assert from "node:assert/strict";
import { Chess } from "chess.js";
import { detectSacrifice, isSacrifice } from "../lib/sacrifice-detector.ts";

// ===== Case 1: undefended knight jumps into attacked square =====
test("sacrifice: undefended knight moves into attacked square", () => {
  const fen = "4k3/8/2p1p3/8/8/2N5/8/4K3 w - - 0 1";
  const r = detectSacrifice(fen, "c3d5");
  assert.equal(r.isSacrifice, true);
  assert.ok(r.materialLoss >= 1.5, `loss=${r.materialLoss}`);
  assert.equal(r.capturedValue, 0);
  assert.equal(isSacrifice(fen, "c3d5"), true);
});

// ===== Case 2: equal trade is not a sacrifice =====
test("sacrifice: equal trade (bishop takes defended knight)", () => {
  // White bishop b4 captures knight c5 (diagonal). Black pd6 recaptures.
  const fen = "4k3/8/3p4/2n5/1B6/8/8/4K3 w - - 0 1";
  const r = detectSacrifice(fen, "b4c5");
  assert.equal(r.isSacrifice, false);
  assert.equal(r.materialLoss, 0);
  assert.equal(r.capturedValue, 3);
});

// ===== Case 3: declined queen sacrifice still detected =====
test("sacrifice: declined queen sacrifice is still detected", () => {
  const fen = "4k3/8/8/3p4/8/3Q4/8/4K3 w - - 0 1";
  const r = detectSacrifice(fen, "d3e4");
  assert.equal(r.isSacrifice, true);
  assert.equal(r.materialLoss, 9);
  assert.equal(r.capturedValue, 0);
});

// ===== Case 4: en passant (KNOWN LIMITATION documented) =====
test("LIMITATION: en passant reported as capturedValue=0", () => {
  const fen = "4k3/8/8/8/1BPp4/8/8/4K3 b - c3 0 1";
  const r = detectSacrifice(fen, "d4c3");
  assert.equal(r.isSacrifice, false);
  assert.equal(r.capturedValue, 0);
});

// ===== Case 5: capture-promotion then queen captured by rook =====
test("sacrifice: capture-promotion captured by rook", () => {
  const fen = "3n3r/4P2k/8/8/8/8/8/4K3 w - - 0 1";
  const r = detectSacrifice(fen, "e7d8q");
  assert.equal(r.isSacrifice, true);
  assert.ok(r.materialLoss >= 1.5, `loss=${r.materialLoss}`);
  assert.equal(r.capturedValue, 3);
});

// ===== Case 6: KNOWN LIMITATION (Byrne-Fischer 17...Be6) =====
test("KNOWN LIMITATION: 17...Be6 in Byrne-Fischer (queen left hanging)", () => {
  const c = new Chess();
  const moves = [
    "Nf3","Nf6","c4","g6","Nc3","Bg7","d4","O-O","Bf4","d5",
    "Qb3","dxc4","Qxc4","c6","e4","Nbd7","Rd1","Nb6","Qc5","Bg4",
    "Bg5","Na4","Qa3","Nxc3","bxc3","Nxe4","Bxe7","Qb6","Bc4","Nxc3",
    "Bc5","Rfe8+","Kf1"
  ];
  for (const m of moves) c.move(m);
  const fen = c.fen();
  const r = detectSacrifice(fen, "g4e6");
  assert.equal(r.isSacrifice, false);
});
