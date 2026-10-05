// lib/position-at-ply.ts
import { Chess } from "chess.js";
import { buildPositions } from "./pgn-analysis.ts";

const DEFAULT_START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/**
 * Return the FEN at ply N (0 = initial, N = after move N).
 * Returns null on out-of-range, non-integer, or illegal SAN.
 */
export function positionAtPly(
  _sans: string[],
  _ply: number,
  _startFen?: string
): string | null {
  throw new Error("positionAtPly is not implemented");
}

export const __DEFAULT_START = DEFAULT_START;
export const __Chess = Chess;
