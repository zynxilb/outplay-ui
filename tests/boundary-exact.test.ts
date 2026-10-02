import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyMove, expectedPoints } from "../lib/classify.ts";

const BP = 10000;
const K = 0.00368208;

/** Closed-form inverse: EP(cp) = t/10000. */
function cpForBp(targetBp: number): number {
  const p = targetBp / BP;
  return -Math.log((1 - p) / p) / K;
}

const bpOf = (cp: number): number => Math.round(expectedPoints(cp) * BP);

const base = {
  isBest: false, isBook: false, isSacrifice: false,
  secondBestEval: null as number | null,
  moverColor: "w" as const, legalMoves: 30,
};

test("cpForBp closed-form sanity: bpOf(cpForBp(t)) === t", () => {
  for (const t of [1000, 3000, 5000, 5500, 6000, 7000, 8000]) {
    assert.equal(bpOf(cpForBp(t)), t, `t=${t}`);
  }
});

function epLossCase(bpBefore: number, bpAfter: number) {
  const eb = cpForBp(bpBefore), ea = cpForBp(bpAfter);
  const actualLoss = bpOf(eb) - bpOf(ea);
  assert.equal(actualLoss, bpBefore - bpAfter, `bpLoss mismatch: ${actualLoss}`);
  return classifyMove({ ...base, evalBefore: eb, evalAfter: ea });
}

test("EXCELLENT_MAX: bpLoss=200 -> Excellent", () => {
  assert.equal(epLossCase(6000, 5800), "Excellent");
});
test("EXCELLENT_MAX: bpLoss=201 -> Good", () => {
  assert.equal(epLossCase(6000, 5799), "Good");
});
test("GOOD_MAX: bpLoss=500 -> Good", () => {
  assert.equal(epLossCase(6000, 5500), "Good");
});
test("GOOD_MAX: bpLoss=501 -> Inaccuracy", () => {
  assert.equal(epLossCase(6000, 5499), "Inaccuracy");
});
test("INACCURACY_MAX: bpLoss=1000 -> Inaccuracy", () => {
  assert.equal(epLossCase(7000, 6000), "Inaccuracy");
});
test("INACCURACY_MAX: bpLoss=1001 -> Mistake", () => {
  assert.equal(epLossCase(7000, 5999), "Mistake");
});
test("MISTAKE_MAX: bpLoss=2000 -> Mistake", () => {
  assert.equal(epLossCase(8000, 6000), "Mistake");
});
test("MISTAKE_MAX: bpLoss=2001 -> Blunder", () => {
  assert.equal(epLossCase(8000, 5999), "Blunder");
});

test("NEAR_BEST_MAX: bpLoss=200 + sacrifice -> Brilliant", () => {
  const eb = cpForBp(6000), ea = cpForBp(5800);
  assert.equal(bpOf(eb) - bpOf(ea), 200);
  const r = classifyMove({
    ...base, isSacrifice: true, evalBefore: eb, evalAfter: ea,
  });
  assert.equal(r, "Brilliant");
});

test("NEAR_BEST_MAX: bpLoss=201 + sacrifice -> not Brilliant (Good)", () => {
  const eb = cpForBp(6000), ea = cpForBp(5799);
  assert.equal(bpOf(eb) - bpOf(ea), 201);
  const r = classifyMove({
    ...base, isSacrifice: true, evalBefore: eb, evalAfter: ea,
  });
  assert.notEqual(r, "Brilliant");
  assert.equal(r, "Good");
});
