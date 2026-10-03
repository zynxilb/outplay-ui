// tests/puzzle-probe.test.ts
// Lichess puzzle format:
//   FEN   = position BEFORE opponent's blunder (opponent to move)
//   Moves = space-separated UCI moves: [opponent blunder, solver solution, ...]

import { test } from "node:test";
import assert from "node:assert/strict";
import { Stockfish } from "@se-oss/stockfish";
import { Chess } from "chess.js";
import fs from "node:fs";
import { classifyMove } from "../lib/classify.ts";
import { sacrificeValue } from "../lib/see.ts";

const DEPTH = 16;

type Puzzle = {
  id: string;
  fen: string;
  moves: string;
  rating: number;
  themes: string[];
};

function playMove(board: Chess, uci: string): boolean {
  try {
    board.move({
      from: uci.slice(0, 2) as any,
      to: uci.slice(2, 4) as any,
      promotion: uci.length > 4 ? (uci[4] as any) : undefined,
    });
    return true;
  } catch {
    return false;
  }
}

function toWhite(score: any, side: "w" | "b"): number {
  if (!score) return 0;
  const mult = side === "w" ? 1 : -1;
  if (score.type === "mate") {
    return (score.value > 0 ? 10000 : -10000) * mult;
  }
  return score.value * mult;
}

async function analyze(
  engine: Stockfish,
  fen: string,
): Promise<{ best: string | null; score: number; second: number | null }> {
  const a = await engine.analyze(fen, DEPTH, 2);
  const side = fen.split(" ")[1] as "w" | "b";
  const lines = a.lines ?? [];
  return {
    best: a.bestmove ?? null,
    score: toWhite(lines[0]?.score, side),
    second: lines[1]?.score ? toWhite(lines[1].score, side) : null,
  };
}

async function main() {
  const puzzles: Puzzle[] = JSON.parse(
    fs.readFileSync("tests/puzzles-20.json", "utf8")
  );

  let pass = 0;
  let total = 0;
  const results: any[] = [];

  for (const p of puzzles) {
    const movesList = p.moves.split(" ");
    if (movesList.length < 2) {
      console.log(`SKIP ${p.id}: insufficient moves`);
      continue;
    }
    const setupMove = movesList[0];
    const solutionMove = movesList[1];

    const board = new Chess(p.fen);
    const opponentColor = board.turn();
    const solverColor = opponentColor === "w" ? "b" : "w";

    if (!playMove(board, setupMove)) {
      console.log(`SKIP ${p.id}: setup move illegal (${setupMove})`);
      continue;
    }

    const solverFen = board.fen();
    const legalMoves = board.moves().length;

    const engine = new Stockfish();
    await engine.waitReady();
    await (engine as any).setOptions({ Threads: 1, Hash: 16 });

    const before = await analyze(engine, solverFen);

    if (!playMove(board, solutionMove)) {
      engine.terminate();
      console.log(`SKIP ${p.id}: solution move illegal (${solutionMove})`);
      continue;
    }

    const afterFen = board.fen();
    const after = await analyze(engine, afterFen);
    engine.terminate();

    const isBest = before.best === solutionMove;

    // Compute real sacrifice value at the destination square.
    // Positive value >= 3 means the opponent can win a minor piece or more.
    let isSacrifice = false;
    let sacValue = 0;
    try {
      sacValue = sacrificeValue(board, solutionMove.slice(2, 4) as any);
      isSacrifice = sacValue >= 3;
    } catch {
      isSacrifice = false;
    }

    const classification = classifyMove({
      isBest,
      isBook: false,
      isSacrifice,
      evalBefore: before.score,
      evalAfter: after.score,
      secondBestEval: before.second,
      moverColor: solverColor,
      legalMoves,
      prevOppEpLoss: 0.5,
    });

    const ok = ["Best", "Great", "Brilliant"].includes(classification);
    total++;
    if (ok) pass++;
    results.push({ id: p.id, rating: p.rating, isBest, isSacrifice, sacValue, classification, ok, themes: p.themes });
    const isSacTheme = p.themes.includes("sacrifice");
    console.log(
      `${ok ? "PASS" : "FAIL"} ${p.id} (r${p.rating}${isSacTheme ? " [SAC]" : ""}): isBest=${isBest} sac=${isSacrifice}(${sacValue}) class=${classification}`
    );
  }

  const recall = total > 0 ? (pass / total) * 100 : 0;
  console.log(`\nRecall (Best/Great/Brilliant): ${pass}/${total} = ${recall.toFixed(0)}%`);
  console.log(`Target: >= 85%`);

  fs.writeFileSync(
    "tests/puzzle-probe-results.json",
    JSON.stringify({ pass, total, recall, results }, null, 2)
  );

  assert.ok(total > 0, "No puzzles were evaluated");
  assert.ok(pass / total >= 0.85, `Recall ${recall.toFixed(0)}% < 85%`);
}

test("Lichess puzzle probe: recall >= 85%", async () => {
  await main();
}, { timeout: 900000 });
