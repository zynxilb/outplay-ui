// lib/chess-helpers.ts
// Re-exports the pure classification logic. Legacy logic lives in
// tests/legacy-classify.ts and is NOT used by the app.

import type { EvalResponse } from "./types";
import { Chess } from "chess.js";
import {
  classifyMove,
  expectedPoints,
  winPercent,
} from "./classify";
import type { ClassifyInput, MoveClassification } from "./classify";

export { classifyMove, expectedPoints, winPercent };
export type { ClassifyInput, MoveClassification };

/** The shape returned by fetchEvalFromServer. */
export type EvalResult = {
  score: number;
  bestMove: string | null;
  secondScore: number | null;
};

const NEUTRAL: EvalResult = { score: 0, bestMove: null, secondScore: null };

export function squareIndexToAlgebraic(square: number): string {
  const file = square % 8;
  const rank = Math.floor(square / 8);
  return String.fromCharCode(97 + file) + (rank + 1);
}

export function normaliseFenForOpening(fen: string): string {
  return fen.split(" ").slice(0, 4).join(" ");
}

export async function fetchEvalFromServer(
  fen: string,
  depth = 12
): Promise<EvalResult> {
  try {
    const response = await fetch("/api/eval", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fen, depth }),
    });
    if (!response.ok) return NEUTRAL;

    const data = (await response.json()) as EvalResponse;

    let score = 0;
    if (data.score?.type === "mate") {
      score = data.score.value > 0 ? 10000 : -10000;
    } else {
      score = data.score?.value ?? 0;
    }

    let secondScore: number | null = null;
    if (data.secondScore) {
      if (data.secondScore.type === "mate") {
        secondScore = data.secondScore.value > 0 ? 10000 : -10000;
      } else {
        secondScore = data.secondScore.value;
      }
    }

    return { score, bestMove: data.bestmove ?? null, secondScore };
  } catch {
    return NEUTRAL;
  }
}

export function estimateGameRating(accuracy: number): number {
  if (accuracy <= 0) return 0;
  const rating = 3100 * Math.pow(accuracy / 100, 2) - 500;
  return Math.max(0, Math.round(rating));
}

export function algebraicToSquareIndex(square: string): number {
  const file = square.charCodeAt(0) - 97;
  const rank = parseInt(square[1], 10) - 1;
  return rank * 8 + file;
}

// silence unused-import warning; Chess is re-exported for callers.
export { Chess };
