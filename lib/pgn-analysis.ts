// lib/pgn-analysis.ts
import { Chess, DEFAULT_POSITION } from "chess.js";
import type { EvalScore } from "./types";

/**
 * Pure function: convert SAN list to FEN list (N+1 FENs).
 * Returns [start, fen1, fen2, ..., fenN].
 * Throws with `Illegal move at ply N: SAN` if a move is illegal.
 */
export function buildPositions(sans: string[], startFen?: string): string[] {
  const start = startFen ?? DEFAULT_POSITION;
  let chess: Chess;

  try {
    chess = new Chess(start);
  } catch {
    throw new Error(`Invalid start FEN: ${start}`);
  }

  const fens: string[] = [chess.fen()];

  for (let i = 0; i < sans.length; i++) {
    const san = sans[i];
    const ply = i + 1;
    try {
      chess.move(san);
    } catch (e) {
      const reason = e instanceof Error ? ` (${e.message})` : "";
      throw new Error(`Illegal move at ply ${ply}: ${san}${reason}`);
    }
    fens.push(chess.fen());
  }

  return fens;
}

// ============ 6b.1 helpers ============

/**
 * Convert an EvalScore to a centipawn integer (White perspective).
 * Mate scores map to ±10000. `mate 0` is invalid and throws.
 * NOTE: terminal evals should be built directly as ±10000 (not passed here).
 */
export function scoreToCp(s: EvalScore): number {
  if (s.type === "mate") {
    if (s.value === 0) {
      throw new Error("scoreToCp: mate score with value 0 is invalid");
    }
    return s.value > 0 ? 10000 : -10000;
  }
  return s.value;
}

/**
 * Compose UCI string from a move's from/to/promotion.
 * Promotion letter is lowercase (Stockfish convention).
 * NOTE: Chess960 is NOT supported — standard chess only.
 */
export function toUci(m: { from: string; to: string; promotion?: string }): string {
  return m.from + m.to + (m.promotion ?? "");
}

/**
 * Check whether the played SAN equals the engine's bestmove (UCI).
 * Returns false for null/empty/"(none)" bestmove, illegal SAN, or invalid FEN.
 * Comparison is case-insensitive on the bestmove side.
 * NOTE: Chess960 is NOT supported — standard chess only.
 */
export function computeIsBest(
  san: string,
  fenBefore: string,
  bestmoveUci: string | null
): boolean {
  if (!bestmoveUci || bestmoveUci === "(none)") return false;

  let chess: Chess;
  try {
    chess = new Chess(fenBefore);
  } catch {
    return false;
  }

  try {
    const m = chess.move(san);
    return toUci({ from: m.from, to: m.to, promotion: m.promotion }) === bestmoveUci.toLowerCase();
  } catch {
    return false;
  }
}
