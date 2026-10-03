// lib/pgn-analysis.ts
import { Chess, DEFAULT_POSITION } from "chess.js";
import type { EvalScore } from "./types";
import type { PGNHeaders } from "./pgn";

// ============ buildPositions ============
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
export function scoreToCp(s: EvalScore): number {
  if (s.type === "mate") {
    if (s.value === 0) {
      throw new Error("scoreToCp: mate score with value 0 is invalid");
    }
    return s.value > 0 ? 10000 : -10000;
  }
  return s.value;
}

export function toUci(m: { from: string; to: string; promotion?: string }): string {
  return m.from + m.to + (m.promotion ?? "");
}

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

// ============ 6b.2a: analyzePGN ============

export interface PositionEval {
  score: EvalScore;
  bestmove: string | null;
  secondScore: EvalScore | null;
}

export type Evaluator = (
  fen: string,
  depth: number
) => Promise<PositionEval>;

export interface MoveAnalysis {
  ply: number;
  san: string;
  fenBefore: string;
  fenAfter: string;
  evalBefore: PositionEval;
  evalAfter: PositionEval;
}

export interface AnalyzeOptions {
  evaluator: Evaluator;
  /** default 12 (Hobby-plan friendly; increase on Pro) */
  depth?: number;
  /** default 3 */
  concurrency?: number;
  onProgress?: (done: number, total: number) => void;
}

export function startFenFromHeaders(_pgn: string): string | undefined {
  throw new Error("startFenFromHeaders is not implemented");
}

/**
 * Analyze a PGN: evaluate each position once (N+1 FENs for N moves).
 * Terminal positions (checkmate/stalemate/insufficient) computed locally,
 * not sent to the evaluator.
 *
 * NOTE: mate scores are symbolic ±10000 (NOT "mate in N"). UI must render `#`.
 * TODO (6b.2b): attach ply + cause to evaluator errors.
 */
export async function analyzePGN(
  _pgn: string,
  _options: AnalyzeOptions
): Promise<{ headers: PGNHeaders; moves: MoveAnalysis[] }> {
  throw new Error("analyzePGN is not implemented");
}
