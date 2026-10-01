// lib/types.ts
// Shared types for the Outplay app.

import type { MoveClassification } from "./chess-helpers";

/** A single named chess opening from the ECO book. */
export type Opening = {
  eco: string;
  name: string;
};

/** The opening book keyed by a normalised FEN (first 4 fields). */
export type OpeningBook = Record<string, Opening>;

/** Type of evaluation score from Stockfish. */
export type EvalScoreType = "cp" | "mate";

export type EvalScore = {
  type: EvalScoreType;
  value: number;
};

export type EvalResponse = {
  bestmove: string;
  score: EvalScore;
  secondScore: EvalScore | null;
};

export type MoveOptions = {
  from: string;
  to: string;
  promotion?: string;
};

export const PROMOTION_PIECES = ["", "n", "b", "r", "q"] as const;

/** A single played move with its classification and evals. */
export type ClassifiedMove = {
  ply: number;
  san: string;
  from: string;
  to: string;
  color: "w" | "b";
  classification: MoveClassification;
  evalBefore: number;
  evalAfter: number;
};
