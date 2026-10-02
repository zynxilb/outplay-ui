import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyMove, expectedPoints } from "../lib/classify.ts";

const k = 0.00368208;
// Analytic inverse: EP -> cp. EP = 1 / (1 + exp(-k*cp)).
function cpForEP(target: number): number {
  return -Math.log((1 - target) / target) / k;
}

const base = {
  isBest: false, isBook: false, isSacrifice: false,
  secondBestEval: null as number | null,
  moverColor: "w" as const, legalMoves: 30,
};

test("cpForEP accuracy: |expectedPoints(cpForEP(t)) - t| < 1e-10", () => {
  for (const t of [0.1, 0.3, 0.5, 0.6, 0.7, 0.8, 0.9]) {
    const diff = Math.abs(expectedPoints(cpForEP(t)) - t);
    assert.ok(diff < 1e-10, `t=${t} diff=${diff}`);
  }
});

const thresholds = [
  { name: "Excellent",  value: 0.02, epBefore: 0.60, next: "Good" },
  { name: "Good",       value: 0.05, epBefore: 0.60, next: "Inaccuracy" },
  { name: "Inaccuracy", value: 0.10, epBefore: 0.70, next: "Mistake" },
  { name: "Mistake",    value: 0.20, epBefore: 0.80, next: "Blunder" },
];

const MARGIN = 1e-4;

for (const t of thresholds) {
  test(`Boundary ${t.value}: under by ${MARGIN} → ${t.name}`, () => {
    const eb = cpForEP(t.epBefore);
    const ea = cpForEP(t.epBefore - t.value + MARGIN);
    const r = classifyMove({ ...base, evalBefore: eb, evalAfter: ea });
    assert.equal(r, t.name, `epLoss ~${t.value - MARGIN}, got ${r}`);
  });
  test(`Boundary ${t.value}: over by ${MARGIN} → ${t.next}`, () => {
    const eb = cpForEP(t.epBefore);
    const ea = cpForEP(t.epBefore - t.value - MARGIN);
    const r = classifyMove({ ...base, evalBefore: eb, evalAfter: ea });
    assert.equal(r, t.next, `epLoss ~${t.value + MARGIN}, got ${r}`);
  });
}

// Exact-boundary report: log what actually happens at exactly 0.02.
test("Boundary report: actual epLoss at target 0.02", () => {
  const eb = cpForEP(0.60);
  const ea = cpForEP(0.58);
  const epLoss = expectedPoints(eb) - expectedPoints(ea);
  console.log(`  Actual epLoss = ${epLoss.toFixed(18)} (target 0.02)`);
  console.log(`  Difference from 0.02: ${(epLoss - 0.02).toExponential(3)}`);
  // Classification at this point:
  const r = classifyMove({ ...base, evalBefore: eb, evalAfter: ea });
  console.log(`  Classification: ${r}`);
});
