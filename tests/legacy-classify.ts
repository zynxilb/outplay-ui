// tests/legacy-classify.ts
// Frozen copy of the pre-refactor classifyMove logic from chess-helpers.ts.
// Used ONLY by compare.ts and fixes.test.ts. Not used by the app.

import { expectedPoints } from "../lib/classify.ts";

export function legacyClassifyMove(input: any): string {
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
