import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyMove } from "../lib/classify.ts";

const base = {
  isBest: false,
  isBook: false,
  isSacrifice: false,
  evalBefore: 0,
  evalAfter: 0,
  secondBestEval: null as number | null,
  moverColor: "w" as const,
};

test("1. Book move returns Book", () => {
  assert.equal(classifyMove({ ...base, isBook: true }), "Book");
});

test("2. Best move returns Best", () => {
  assert.equal(classifyMove({ ...base, isBest: true, evalBefore: 50, evalAfter: 50 }), "Best");
});

test("3. Mate for us (10000) is Best", () => {
  assert.equal(classifyMove({ ...base, isBest: true, evalBefore: 10000, evalAfter: 10000 }), "Best");
});

test("4. Perspective flip: black as mover, eval from White", () => {
  // evalBefore/After are from White's perspective. For black mover, we flip.
  const r = classifyMove({
    ...base, moverColor: "b", isBest: true,
    evalBefore: -50, evalAfter: -50,
  });
  assert.equal(r, "Best");
});

test("5. Excellent threshold (epLoss <= 0.02)", () => {
  // Small cp loss -> Excellent
  const r = classifyMove({ ...base, evalBefore: 20, evalAfter: 15 });
  assert.equal(r, "Excellent");
});

test("6. Good threshold (epLoss <= 0.05)", () => {
  const r = classifyMove({ ...base, evalBefore: 50, evalAfter: 0 });
  assert.equal(r, "Good");
});

test("7. Inaccuracy threshold (epLoss <= 0.10)", () => {
  const r = classifyMove({ ...base, evalBefore: 100, evalAfter: 0 });
  assert.equal(r, "Inaccuracy");
});

test("8. Mistake threshold (epLoss <= 0.20)", () => {
  const r = classifyMove({ ...base, evalBefore: 200, evalAfter: 0 });
  assert.equal(r, "Mistake");
});

test("9. Blunder (> 0.20)", () => {
  const r = classifyMove({ ...base, evalBefore: 400, evalAfter: 0 });
  assert.equal(r, "Blunder");
});

test("10. Miss with opponent prior blunder", () => {
  // Was winning (epBefore ~0.9), gave it away (epAfter ~0.5), opponent blundered.
  const r = classifyMove({
    ...base,
    evalBefore: 500, evalAfter: 0,
    prevOppEpLoss: 0.5,
  });
  assert.equal(r, "Miss");
});

test("11. Miss without opponent prior blunder -> falls through", () => {
  const r = classifyMove({
    ...base,
    evalBefore: 500, evalAfter: 0,
    prevOppEpLoss: 0.0,
  });
  assert.notEqual(r, "Miss");
});

test("12. Miss with epAfter < 0.3 becomes Blunder (not Miss)", () => {
  // Was winning but now losing badly -> it's a Blunder, not a Miss.
  const r = classifyMove({
    ...base,
    evalBefore: 500, evalAfter: -500,
    prevOppEpLoss: 0.5,
  });
  assert.equal(r, "Blunder");
});

test("13. Brilliant: best + sacrifice + still winning", () => {
  const r = classifyMove({
    ...base,
    isBest: true, isSacrifice: true,
    evalBefore: 100, evalAfter: 200,
  });
  assert.equal(r, "Brilliant");
});

test("14. Great skipped for forced move (legalMoves = 1)", () => {
  // Only 1 legal move -> not Great.
  const r = classifyMove({
    ...base,
    isBest: true, legalMoves: 1,
    evalBefore: 500, evalAfter: 500,
    secondBestEval: 0,
  });
  assert.equal(r, "Best");
});

test("15. Great at win boundary crossing", () => {
  // epBefore ~ 0.9, epSecond ~ 0.4 (crosses 0.7 boundary), gap ~ 0.5
  const r = classifyMove({
    ...base,
    isBest: true, legalMoves: 30,
    evalBefore: 500, evalAfter: 500,
    secondBestEval: 0,
  });
  assert.equal(r, "Great");
});
