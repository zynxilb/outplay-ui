// tests/classify-eploss.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { epLossFor } from "../lib/classify.ts";

const base = {
  isBest: false,
  isBook: false,
  isSacrifice: false,
  evalBefore: 0,
  evalAfter: 0,
  secondBestEval: null,
  moverColor: "w" as const,
};

test("epLossFor: identical evals -> 0", () => {
  assert.equal(epLossFor({ ...base, evalBefore: 100, evalAfter: 100 }), 0);
});

test("epLossFor: white improves -> 0 (clamped)", () => {
  assert.equal(epLossFor({ ...base, evalBefore: 0, evalAfter: 100 }), 0);
});

test("epLossFor: white worsens -> positive", () => {
  assert.ok(epLossFor({ ...base, evalBefore: 100, evalAfter: 0 }) > 0);
});

test("epLossFor: black improves -> 0 (clamped)", () => {
  assert.equal(
    epLossFor({ ...base, moverColor: "b", evalBefore: 0, evalAfter: -100 }),
    0
  );
});

test("epLossFor: black worsens -> positive", () => {
  assert.ok(
    epLossFor({ ...base, moverColor: "b", evalBefore: -100, evalAfter: 0 }) > 0
  );
});

test("epLossFor: returns [0, 1] range", () => {
  const loss = epLossFor({ ...base, evalBefore: 10000, evalAfter: -10000 });
  assert.ok(loss >= 0 && loss <= 1);
});

test("epLossFor: perspective symmetry (white vs black, same magnitude)", () => {
  const whiteLoss = epLossFor({
    ...base, moverColor: "w", evalBefore: 100, evalAfter: 50,
  });
  const blackLoss = epLossFor({
    ...base, moverColor: "b", evalBefore: -100, evalAfter: -50,
  });
  assert.equal(whiteLoss, blackLoss);
});
