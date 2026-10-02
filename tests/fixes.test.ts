import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyMove, expectedPoints } from "../lib/classify.ts";

// Old logic — copied verbatim from the pre-refactor chess-helpers.ts.
function oldClassify(input: any): string {
  const {
    isBest, isBook, isSacrifice: sacrifice,
    evalBefore, evalAfter, secondBestEval, moverColor,
    prevOppEpLoss = 1,
  } = input;
  if (isBook) return "Book";
  const moverBefore = moverColor === "w" ? evalBefore : -evalBefore;
  const moverAfter = moverColor === "w" ? evalAfter : -evalAfter;
  const epBefore = expectedPoints(moverBefore);
  const epAfter = expectedPoints(moverAfter);
  const epLoss = Math.max(0, epBefore - epAfter);
  if (epBefore >= 0.7 && epAfter <= 0.55 && epLoss >= 0.15 && prevOppEpLoss >= 0.1) return "Miss";
  const isNearBest = isBest || epLoss <= 0.02;
  if (isNearBest && sacrifice && epAfter >= 0.5 && epBefore < 0.9) return "Brilliant";
  if (isBest && secondBestEval !== null) {
    const ms = moverColor === "w" ? secondBestEval : -secondBestEval;
    const epSecond = expectedPoints(ms);
    const gap = epBefore - epSecond;
    const crossesWin = epBefore >= 0.7 && epSecond < 0.7;
    const crossesLoss = epBefore >= 0.3 && epSecond < 0.3;
    if (gap >= 0.10 && (crossesWin || crossesLoss)) return "Great";
  }
  if (isBest) return "Best";
  if (epLoss <= 0.02) return "Excellent";
  if (epLoss <= 0.05) return "Good";
  if (epLoss <= 0.1) return "Inaccuracy";
  if (epLoss <= 0.2) return "Mistake";
  return "Blunder";
}

const base = {
  isBest: false, isBook: false, isSacrifice: false,
  evalBefore: 0, evalAfter: 0,
  secondBestEval: null as number | null,
  moverColor: "w" as const,
  legalMoves: 30,
};

test("Fix 3: Miss ceiling — old=Miss, new!=Miss when epAfter < 0.3", () => {
  const input = { ...base, evalBefore: 500, evalAfter: -800, prevOppEpLoss: 0.5 };
  assert.equal(oldClassify(input), "Miss", "old must say Miss");
  assert.notEqual(classifyMove(input), "Miss", "new must NOT say Miss");
});

test("Fix 4: Miss precedence — Miss only when still not losing", () => {
  // Still not losing (epAfter ~0.5): Miss in both old and new.
  const equalish = { ...base, evalBefore: 500, evalAfter: 0, prevOppEpLoss: 0.5 };
  assert.equal(oldClassify(equalish), "Miss");
  assert.equal(classifyMove(equalish), "Miss");

  // Losing badly (epAfter < 0.3): old=Miss, new!=Miss.
  const losing = { ...base, evalBefore: 500, evalAfter: -800, prevOppEpLoss: 0.5 };
  assert.equal(oldClassify(losing), "Miss");
  assert.notEqual(classifyMove(losing), "Miss");
});

test("Fix 5: First move (prevOppEpLoss = undefined) — old=Miss, new!=Miss", () => {
  const input: any = { ...base, evalBefore: 500, evalAfter: 0 };
  // deliberately omit prevOppEpLoss so the default kicks in
  assert.equal(oldClassify(input), "Miss", "old default=1 -> Miss");
  assert.notEqual(classifyMove(input), "Miss", "new default=null -> not Miss");
});

test("Fix 6: Forced move (legalMoves=1) — old=Great, new=Best", () => {
  const input = {
    ...base, isBest: true, legalMoves: 1,
    evalBefore: 500, evalAfter: 500,
    secondBestEval: 0,
  };
  assert.equal(oldClassify(input), "Great", "old says Great");
  assert.equal(classifyMove(input), "Best", "new says Best");
});
