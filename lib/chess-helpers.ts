// lib/chess-helpers.ts
// Pure helper functions used across the app.

import type { EvalResponse } from "./types";

/**
 * Convert a gigaboard square index (LERF: 0=a1, 63=h8) to algebraic notation.
 */
export function squareIndexToAlgebraic(square: number): string {
  const file = square % 8;
  const rank = Math.floor(square / 8);
  return String.fromCharCode(97 + file) + (rank + 1);
}

/**
 * Normalise a FEN to the first 4 fields, which are the only ones that matter
 * for looking up the opening in the book.
 *
 * Example: "rnb... b KQkq - 0 1" → "rnb... b KQkq -"
 */
export function normaliseFenForOpening(fen: string): string {
  return fen.split(" ").slice(0, 4).join(" ");
}

/**
 * Ask the server-side Stockfish engine for an evaluation of the given FEN.
 *
 * Returns centipawns from white's perspective. Mate scores are mapped to
 * ±10000 so the rest of the UI can treat them like ordinary numbers.
 */
export async function fetchEvalFromServer(
  fen: string,
  depth = 10
): Promise<number> {
  try {
    const response = await fetch("/api/eval", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fen, depth }),
    });

    if (!response.ok) return 0;

    const data = (await response.json()) as EvalResponse;

    if (data.score?.type === "mate") {
      return data.score.value > 0 ? 10000 : -10000;
    }
    return data.score?.value ?? 0;
  } catch {
    return 0;
  }
}
