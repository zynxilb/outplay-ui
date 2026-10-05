// lib/position-at-ply.ts
import { buildPositions } from "./pgn-analysis.ts";

const DEFAULT_START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/**
 * Return the FEN at ply N.
 * - ply 0 = initial position
 * - ply N = position after move N
 * - Returns null on out-of-range, non-integer, or illegal SAN.
 */
export function positionAtPly(
  sans: string[],
  ply: number,
  startFen?: string
): string | null {
  if (!Number.isInteger(ply)) return null;
  if (ply < 0) return null;
  if (ply > sans.length) return null;

  try {
    const fens = buildPositions(sans.slice(0, ply), startFen ?? DEFAULT_START);
    return fens[ply] ?? null;
  } catch {
    return null;
  }
}
