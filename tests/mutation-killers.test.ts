import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyMove, expectedPoints } from "../lib/classify.ts";

const k = 0.00368208;
function cpForEP(target: number): number {
  return -Math.log((1 - target) / target) / k;
}

const base = {
  isBest: false, isBook: false, isSacrifice: false,
  secondBestEval: null as number | null,
  moverColor: "w" as const, legalMoves: 30,
};

// ===== Miss survivors =====

test("Kill: Miss bigLoss (epLoss=0.20, needs >= 0.15)", () => {
  // epBefore=0.75, epAfter=0.55 -> epLoss=0.20
  const r = classifyMove({
    ...base,
    evalBefore: cpForEP(0.75), evalAfter: cpForEP(0.55),
    prevOppEpLoss: 0.5,
  });
  assert.equal(r, "Miss", "epLoss=0.20 must satisfy bigLoss>=0.15");
});

test("Kill: Miss gaveItAway (epAfter=0.60, must be <= 0.55)", () => {
  // epAfter=0.60 > 0.55, so NOT Miss. epLoss=0.25 -> Blunder.
  const r = classifyMove({
    ...base,
    evalBefore: cpForEP(0.85), evalAfter: cpForEP(0.60),
    prevOppEpLoss: 0.5,
  });
  assert.equal(r, "Blunder", "epAfter=0.60 must not qualify as Miss");
});

test("Kill: Miss wasWinning (epBefore=0.75, needs >= 0.7)", () => {
  // epBefore=0.75, epAfter=0.50 -> epLoss=0.25. Miss.
  const r = classifyMove({
    ...base,
    evalBefore: cpForEP(0.75), evalAfter: cpForEP(0.50),
    prevOppEpLoss: 0.5,
  });
  assert.equal(r, "Miss", "epBefore=0.75 must satisfy wasWinning>=0.7");
});

test("Kill: Miss prevOppEpLoss (value 0.15, needs >= 0.10)", () => {
  // prevOpp=0.15 must trigger Miss; mutation to >=0.2 would fail.
  const r = classifyMove({
    ...base,
    evalBefore: cpForEP(0.80), evalAfter: cpForEP(0.50),
    prevOppEpLoss: 0.15,
  });
  assert.equal(r, "Miss", "prevOppEpLoss=0.15 must satisfy >=0.10");
});

test("Kill: Miss stillNotLosing (epAfter=0.35, needs >= 0.30)", () => {
  // epAfter=0.35, epBefore=0.75. epLoss=0.40. Miss.
  const r = classifyMove({
    ...base,
    evalBefore: cpForEP(0.75), evalAfter: cpForEP(0.35),
    prevOppEpLoss: 0.5,
  });
  assert.equal(r, "Miss", "epAfter=0.35 must satisfy stillNotLosing>=0.30");
});

// ===== Brilliant survivors =====

test("Kill: Brilliant epAfter (value 0.55, needs >= 0.50)", () => {
  const r = classifyMove({
    ...base, isBest: true, isSacrifice: true,
    evalBefore: cpForEP(0.85), evalAfter: cpForEP(0.55),
  });
  assert.equal(r, "Brilliant", "epAfter=0.55 must satisfy >=0.50");
});

test("Kill: Brilliant epBefore (value 0.85, needs < 0.90)", () => {
  const r = classifyMove({
    ...base, isBest: true, isSacrifice: true,
    evalBefore: cpForEP(0.85), evalAfter: cpForEP(0.55),
  });
  assert.equal(r, "Brilliant", "epBefore=0.85 must satisfy <0.90");
});

// ===== Great survivors =====

test("Kill: Great gap (value 0.12, needs >= 0.10)", () => {
  // epBefore=0.40, epSecond=0.28. gap=0.12. crossesLoss triggers.
  const r = classifyMove({
    ...base, isBest: true, legalMoves: 30,
    evalBefore: cpForEP(0.40), evalAfter: cpForEP(0.40),
    secondBestEval: cpForEP(0.28),
  });
  assert.equal(r, "Great", "gap=0.12 must satisfy >=0.10");
});

test("Kill: Great crossesWin (epBefore=0.72, needs >= 0.70)", () => {
  // epBefore=0.72, epSecond=0.55. crossesWin original: 0.72>=0.7, 0.55<0.7 -> true.
  // Mutated 0.75: 0.72>=0.75 false -> not Great.
  const r = classifyMove({
    ...base, isBest: true, legalMoves: 30,
    evalBefore: cpForEP(0.72), evalAfter: cpForEP(0.72),
    secondBestEval: cpForEP(0.55),
  });
  assert.equal(r, "Great", "crossesWin must trigger at epBefore=0.72");
});

test("Kill: Great crossesLoss (epBefore=0.32, needs >= 0.30)", () => {
  // epBefore=0.32, epSecond=0.18. gap=0.14. crossesLoss triggers.
  const r = classifyMove({
    ...base, isBest: true, legalMoves: 30,
    evalBefore: cpForEP(0.32), evalAfter: cpForEP(0.32),
    secondBestEval: cpForEP(0.18),
  });
  assert.equal(r, "Great", "crossesLoss must trigger at epBefore=0.32");
});

// ===== Excellent survivor =====

test("Kill: Excellent (epLoss=0.025, must be > 0.02)", () => {
  // epBefore=0.625, epAfter=0.60. epLoss=0.025 -> Good, not Excellent.
  const r = classifyMove({
    ...base,
    evalBefore: cpForEP(0.625), evalAfter: cpForEP(0.60),
  });
  assert.equal(r, "Good", "epLoss=0.025 must not be Excellent");
});

// ===== 1.4 Miss precedence =====

test("1.4: 0.9 -> 0.5 with opponent blunder => Miss", () => {
  const r = classifyMove({
    ...base,
    evalBefore: cpForEP(0.90), evalAfter: cpForEP(0.50),
    prevOppEpLoss: 0.5,
  });
  assert.equal(r, "Miss", "epAfter=0.5 still qualifies as Miss");
});

test("1.4: 0.9 -> 0.25 with opponent blunder => Blunder (not Miss)", () => {
  const r = classifyMove({
    ...base,
    evalBefore: cpForEP(0.90), evalAfter: cpForEP(0.25),
    prevOppEpLoss: 0.5,
  });
  assert.equal(r, "Blunder", "epAfter=0.25 < 0.3 must fall through to Blunder");
});
