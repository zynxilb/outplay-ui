import { test } from "node:test";
import assert from "node:assert/strict";
import { Chess } from "chess.js";
import { classifyMove as newClassify, expectedPoints } from "../lib/classify.ts";
import { legacyClassifyMove as oldClassify } from "./legacy-classify.ts";

// ---- Synthetic fix-triggering cases ----
const syntheticCases: { name: string; fix: string; input: any }[] = [
  {
    name: "Fix 5 (first move, prevOppEpLoss undefined)",
    fix: "5-first",
    input: {
      isBest: false, isBook: false, isSacrifice: false,
      evalBefore: 500, evalAfter: 0, secondBestEval: null,
      moverColor: "w", legalMoves: 30,
    },
  },
  {
    name: "Fix 3 (Miss ceiling, epAfter < 0.3)",
    fix: "3-ceiling",
    input: {
      isBest: false, isBook: false, isSacrifice: false,
      evalBefore: 500, evalAfter: -800, secondBestEval: null,
      moverColor: "w", legalMoves: 30, prevOppEpLoss: 0.5,
    },
  },
  {
    name: "Fix 6 (forced move, legalMoves=1)",
    fix: "6-forced",
    input: {
      isBest: true, isBook: false, isSacrifice: false,
      evalBefore: 500, evalAfter: 500, secondBestEval: 0,
      moverColor: "w", legalMoves: 1, prevOppEpLoss: 0.1,
    },
  },
];

test("Synthetic: fixes 3, 5, 6 each trigger a classification change", () => {
  for (const c of syntheticCases) {
    const oldR = oldClassify(c.input);
    const newR = newClassify(c.input);
    console.log(`  ${c.name}: old=${oldR} new=${newR}`);
    assert.notEqual(oldR, newR, `${c.name}: expected change, got same`);
  }
});

// ---- Real game wiring ----
const MOVES = [
  "e4","e5","Nf3","Nc6","Bb5","a6","Ba4","Nf6","O-O","Be7",
  "Re1","b5","Bb3","d6","c3","O-O","h3","Nb8","d4","Nbd7",
];
const EVALS_WHITE = [10, 15, 20, 25, 30, -10, -5, 0, 25, 50,
                      40, 35, 30, 25, 20, 15, 10, 5, 0, -10];

test("Wiring: real 20-ply game, all diffs categorized", () => {
  const game = new Chess();
  let prevOppEpLoss: number | null = null;
  let unexplained = 0;
  let diffs = 0;

  for (let i = 0; i < MOVES.length; i++) {
    const fenBefore = game.fen();
    const moverColor = game.turn();
    const legalMoves = new Chess(fenBefore).moves().length;
    game.move(MOVES[i]);

    const evalBefore = EVALS_WHITE[i];
    const evalAfter = EVALS_WHITE[Math.min(i + 1, EVALS_WHITE.length - 1)];
    const secondBestEval = evalBefore + 30;

    const input: any = {
      isBest: false, isBook: false, isSacrifice: false,
      evalBefore, evalAfter, secondBestEval, moverColor, legalMoves,
    };
    if (prevOppEpLoss !== null) input.prevOppEpLoss = prevOppEpLoss;

    const oldR = oldClassify(input);
    const newR = newClassify(input);

    if (oldR !== newR) {
      diffs++;
      const ea = moverColor === "w" ? evalAfter : -evalAfter;
      const epAfter = expectedPoints(ea);
      let fix = "UNEXPLAINED";
      if (legalMoves === 1 && oldR === "Great") fix = "6-forced";
      else if (prevOppEpLoss === null && oldR === "Miss") fix = "5-first";
      else if (oldR === "Miss" && epAfter < 0.3) fix = "3-ceiling";
      else if (oldR === "Miss" && newR !== "Miss") fix = "4-precedence";
      console.log(`  ply=${i + 1} ${MOVES[i]}: ${oldR}->${newR} [${fix}]`);
      if (fix === "UNEXPLAINED") unexplained++;
    }

    const eb = moverColor === "w" ? evalBefore : -evalBefore;
    const ea = moverColor === "w" ? evalAfter : -evalAfter;
    prevOppEpLoss = Math.max(0, expectedPoints(eb) - expectedPoints(ea));
  }

  console.log(`  Total diffs: ${diffs}, unexplained: ${unexplained}`);
  assert.equal(unexplained, 0);
});
