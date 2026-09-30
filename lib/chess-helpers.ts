// lib/chess-helpers.ts
// Pure helper functions used across the app.

import type { EvalResponse } from "./types";

/** The shape returned by fetchEvalFromServer. */
export type EvalResult = {
  score: number;
  bestMove: string | null;
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

const NEUTRAL: EvalResult = { score: 0, bestMove: null };

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
    return { score, bestMove: data.bestmove ?? null };
  } catch {
    return NEUTRAL;
  }
}

type ClassifyInput = {
  cpLoss: number;
  isBest: boolean;
  isBook: boolean;
  evalBefore: number;
  evalAfter: number;
  moverColor: "w" | "b";
};

export function classifyMove({
  cpLoss,
  isBest,
  isBook,
  evalBefore,
  evalAfter,
  moverColor,
}: ClassifyInput): MoveClassification {
  if (isBook) return "Book";

  const moverBefore = moverColor === "w" ? evalBefore : -evalBefore;
  const moverAfter = moverColor === "w" ? evalAfter : -evalAfter;

  // Miss: had a clear winning position, and dropped below the winning
  // threshold (150 cp). Only triggers when the move actually wasted a win.
  if (moverBefore >= 150 && moverAfter < 150 && cpLoss >= 150) {
    return "Miss";
  }

  if (isBest) return "Best";
  if (cpLoss < 20) return "Excellent";
  if (cpLoss < 50) return "Good";
  if (cpLoss < 100) return "Inaccuracy";
  if (cpLoss < 300) return "Mistake";
  return "Blunder";
}
