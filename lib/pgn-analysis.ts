// lib/pgn-analysis.ts
import { Chess, DEFAULT_POSITION } from "chess.js";

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
import type { EvalScore } from "./types";

export function scoreToCp(_s: EvalScore): number {
  throw new Error("scoreToCp is not implemented");
}

export function toUci(_m: { from: string; to: string; promotion?: string }): string {
  throw new Error("toUci is not implemented");
}

export function computeIsBest(
  _san: string,
  _fenBefore: string,
  _bestmoveUci: string | null
): boolean {
  throw new Error("computeIsBest is not implemented");
}
