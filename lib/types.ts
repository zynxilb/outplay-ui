// lib/types.ts
// Shared types for the Outplay app.

/** A single named chess opening from the ECO book. */
export type Opening = {
  eco: string;
  name: string;
};

/** The opening book keyed by a normalised FEN (first 4 fields). */
export type OpeningBook = Record<string, Opening>;

/** Type of evaluation score from Stockfish. */
export type EvalScoreType = "cp" | "mate";

/** A Stockfish evaluation score. */
export type EvalScore = {
  type: EvalScoreType;
  value: number;
};

/** The response shape returned by `/api/eval`. */
export type EvalResponse = {
  bestmove: string;
  score: EvalScore;
};

/** Options passed to chess.js when making a move. */
export type MoveOptions = {
  from: string;
  to: string;
  promotion?: string;
};

/** The promotion piece letters in the same order as gigaboard promo codes. */
export const PROMOTION_PIECES = ["", "n", "b", "r", "q"] as const;
