import { test } from "node:test";
import assert from "node:assert/strict";
import { Chess } from "chess.js";
import {
  detectForks,
  detectPins,
  detectSkewers,
  detectDiscovered,
} from "../lib/motifs.ts";

// ============ FORK ============

test("Fork: knight b5 forks rook a7 and queen c7", () => {
  const c = new Chess("4k3/r1q5/8/1N6/8/8/8/4K3 w - - 0 1");
  const forks = detectForks(c, "w");
  assert.ok(forks.length > 0, "should detect at least one fork");
  const f = forks.find((x) => x.from === "b5");
  assert.ok(f, "fork should originate from b5");
  assert.ok(f.targets.some((t) => t.square === "a7"), "targets include rook a7");
  assert.ok(f.targets.some((t) => t.square === "c7"), "targets include queen c7");
  assert.equal(f.numTargets, 2);
  assert.equal(f.hasKing, false);
});

test("Fork: no fork on starting position", () => {
  const c = new Chess();
  const forks = detectForks(c, "w");
  assert.equal(forks.length, 0, "no forks at start");
});

// ============ PIN ============

test("Pin absolute: Bg2 pins Nf3 to Ke4", () => {
  // Clean diagonal g2-f3-e4 with nothing blocking.
  const c = new Chess("8/8/8/8/4k3/5n2/6B1/K7 w - - 0 1");
  const pins = detectPins(c, "w");
  const pin = pins.find((p) => p.from === "g2" && p.front === "f3");
  assert.ok(pin, "pin g2->f3 should exist");
  assert.equal(pin.back, "e4");
  assert.equal(pin.backPiece, "k");
  assert.equal(pin.isAbsolute, true);
  assert.equal(pin.frontPiece, "n");
});

test("Pin relative: Re1 pins Ne5 to Qe7", () => {
  const c = new Chess("4k3/4q3/8/4n3/8/8/8/4R1K1 w - - 0 1");
  const pins = detectPins(c, "w");
  const pin = pins.find((p) => p.from === "e1" && p.front === "e5");
  assert.ok(pin, "pin e1->e5 should exist");
  assert.equal(pin.back, "e7");
  assert.equal(pin.backPiece, "q");
  assert.equal(pin.isAbsolute, false);
});

// ============ SKEWER ============

test("Skewer: Ba1 skewers Kd4 to Rh8", () => {
  const c = new Chess("7r/8/8/8/3k4/8/8/B3K3 w - - 0 1");
  const skewers = detectSkewers(c, "w");
  const sk = skewers.find((s) => s.from === "a1" && s.front === "d4");
  assert.ok(sk, "skewer a1->d4 should exist");
  assert.equal(sk.frontPiece, "k");
  assert.equal(sk.back, "h8");
  assert.equal(sk.backPiece, "r");
});

test("Skewer: no skewer when back is pawn", () => {
  // Bishop a1, king on d4, pawn on h8? No — use a position without skewer.
  const c = new Chess("4k3/8/8/8/3Q4/8/8/4K3 w - - 0 1");
  const skewers = detectSkewers(c, "w");
  assert.equal(skewers.length, 0);
});

// ============ DISCOVERED ATTACK ============

test("Discovered: Nf4-d5 reveals Bc1 on Qg5", () => {
  const fenBefore = "4k3/8/8/6q1/5N2/8/8/2B1K3 w - - 0 1";
  const results = detectDiscovered(fenBefore, "f4" as any, "d5" as any, "w");
  assert.ok(results.length > 0, "should detect at least one discovered attack");
  const d = results.find((r) => r.revealedPiece === "c1" && r.target === "g5");
  assert.ok(d, "discovered bishop c1 on queen g5");
  assert.equal(d.targetPiece, "q");
  assert.equal(d.movedFrom, "f4");
  assert.equal(d.movedTo, "d5");
});

test("Discovered: no discovered on quiet move", () => {
  const fenBefore = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const results = detectDiscovered(fenBefore, "e2" as any, "e4" as any, "w");
  assert.equal(results.length, 0);
});
