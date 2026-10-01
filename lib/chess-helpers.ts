// lib/chess-helpers.ts
// Pure helper functions used across the app.

import type { EvalResponse } from "./types";

/** The shape returned by fetchEvalFromServer. */
export type EvalResult = {
  score: number;
  bestMove: string | null;
  /** Score of the second-best move, if the engine returned multiple lines. */
  secondScore: number | null;
};

export type MoveClassification =
  | "Brilliant"
  | "Great"
  | "Best"
  | "Excellent"
  | "Good"
  | "Book"
  | "Inaccuracy"
  | "Mistake"
  | "Miss"
  | "Blunder";

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

/**
 * Convert a centipawn evaluation to a win probability (0–100), from White's
 * perspective. This is the Lichess S-curve.
 */
export function winPercent(cp: number): number {
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);
}

/**
 * Expected Points: the Lichess win-probability normalised to 0–1.
 * This is what Chess.com calls "Expected Points" internally.
 */
export function expectedPoints(cp: number): number {
  return winPercent(cp) / 100;
}

type ClassifyInput = {
  isBest: boolean;
  isBook: boolean;
  isSacrifice: boolean;
  evalBefore: number;
  evalAfter: number;
  secondBestEval: number | null;
  moverColor: "w" | "b";
};

/**
 * Classify a move using Expected Points — the same approach as Chess.com's
 * ClassificationV2 and Lichess's accuracy engine.
 *
 * Order of precedence:
 *   1. Book       — the move is in the opening book
 *   2. Brilliant  — best move + a sacrifice that pays off
 *   3. Great      — best move + the only good option (large gap to 2nd best)
 *   4. Miss       — was winning, gave it away
 *   5. Best       — matches the engine's top choice
 *   6. Excellent  — expected-points loss ≤ 0.02
 *   7. Good       — ≤ 0.05
 *   8. Inaccuracy — ≤ 0.10
 *   9. Mistake    — ≤ 0.20
 *  10. Blunder    — > 0.20
 */
export function classifyMove({
  isBest,
  isBook,
  isSacrifice: sacrifice,
  evalBefore,
  evalAfter,
  secondBestEval,
  moverColor,
}: ClassifyInput): MoveClassification {
  if (isBook) return "Book";

  const moverBefore = moverColor === "w" ? evalBefore : -evalBefore;
  const moverAfter = moverColor === "w" ? evalAfter : -evalAfter;

  const epBefore = expectedPoints(moverBefore);
  const epAfter = expectedPoints(moverAfter);
  const epLoss = Math.max(0, epBefore - epAfter);

  // Miss: was winning, gave it away.
  if (epBefore >= 0.7 && epAfter <= 0.55 && epLoss >= 0.15) {
    return "Miss";
  }

  // Brilliant: best move + sacrifice + still reasonable + not already crushing.
  if (isBest && sacrifice && epAfter >= 0.5 && epBefore < 0.9) {
    return "Brilliant";
  }

  // Great: best move + clearly the only good option.
  if (isBest && secondBestEval !== null) {
    const moverSecond =
      moverColor === "w" ? secondBestEval : -secondBestEval;
    const epSecond = expectedPoints(moverSecond);
    const gap = epBefore - epSecond;
    if (gap >= 0.15) return "Great";
  }

  if (isBest) return "Best";
  if (epLoss <= 0.02) return "Excellent";
  if (epLoss <= 0.05) return "Good";
  if (epLoss <= 0.1) return "Inaccuracy";
  if (epLoss <= 0.2) return "Mistake";
  return "Blunder";
}

/**
 * Estimate a game rating from accuracy, using an approximation of the
 * relationship Chess.com uses for its "Game Rating" feature.
 *
 * Formula: 3100 * (accuracy/100)^2 - 500
 *   accuracy 50% → 275
 *   accuracy 70% → 1019
 *   accuracy 85% → 1740
 *   accuracy 95% → 2298
 */
export function estimateGameRating(accuracy: number): number {
  if (accuracy <= 0) return 0;
  const rating = 3100 * Math.pow(accuracy / 100, 2) - 500;
  return Math.max(0, Math.round(rating));
}

/** Convert algebraic square (e.g. "e4") to a gigaboard SquareIndex (0-63). */
export function algebraicToSquareIndex(square: string): number {
  const file = square.charCodeAt(0) - 97;
  const rank = parseInt(square[1], 10) - 1;
  return rank * 8 + file;
}
