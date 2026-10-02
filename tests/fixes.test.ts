import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyMove, expectedPoints } from "../lib/classify.ts";

import { legacyClassifyMove as oldClassify } from "./legacy-classify.ts";

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
