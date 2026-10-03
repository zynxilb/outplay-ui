// lib/pgn-analysis.ts
import { Chess, DEFAULT_POSITION } from "chess.js";
import type { EvalScore } from "./types";
import { parseHeaders, parseMoves, type PGNHeaders } from "./pgn.ts";
import { mapWithConcurrency } from "./concurrency.ts";

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

/**
 * Extract a starting FEN from PGN headers.
 * Returns the FEN ONLY if `[SetUp "1"]` is present alongside `[FEN "..."]`.
 * If either is missing, returns undefined (header is ignored).
 */
export function startFenFromHeaders(pgn: string): string | undefined {
  const headers = parseHeaders(pgn);
  if (headers.setUp !== "1") return undefined;
  if (!headers.fen) return undefined;
  return headers.fen;
}

/**
 * Analyze a PGN: evaluate each position once (N+1 FENs for N moves).
 * - Terminal positions (checkmate/stalemate/insufficient) computed locally,
 *   NOT sent to the evaluator.
 * - `evalAfter[n]` and `evalBefore[n+1]` share the same object reference.
 * - Empty PGN returns `{headers, moves: []}` with zero evaluator calls
 *   and zero progress callbacks (the `[FEN]` header is not inspected).
 * - `isInsufficientMaterial` may fire mid-game (chess.js still permits moves);
 *   its eval is `cp 0` with `bestmove: null`, so `isBest` will be false.
 *
 * NOTE: mate scores are symbolic ±10000 (NOT "mate in N"). UI must render `#`.
 * TODO (6b.2b): attach ply + cause to evaluator errors, add AbortSignal.
 */
export async function analyzePGN(
  pgn: string,
  options: AnalyzeOptions
): Promise<{ headers: PGNHeaders; moves: MoveAnalysis[] }> {
  const { evaluator, depth = 12, concurrency = 3, onProgress } = options;

  const headers = parseHeaders(pgn);
  const sans = parseMoves(pgn);

  // Empty PGN: no moves, no eval, no progress
  if (sans.length === 0) {
    return { headers, moves: [] };
  }

  const startFen = startFenFromHeaders(pgn);
  const fens = buildPositions(sans, startFen);

  // 1) Terminal FENs (computed locally)
  const terminalEvals = new Map<number, PositionEval>();
  for (let i = 0; i < fens.length; i++) {
    const chess = new Chess(fens[i]);
    if (chess.isCheckmate()) {
      const loser = chess.turn();
      const value = loser === "w" ? -10000 : 10000;
      terminalEvals.set(i, {
        score: { type: "mate", value },
        bestmove: null,
        secondScore: null,
      });
    } else if (chess.isStalemate() || chess.isInsufficientMaterial()) {
      terminalEvals.set(i, {
        score: { type: "cp", value: 0 },
        bestmove: null,
        secondScore: null,
      });
    }
  }

  // 2) Non-terminal FENs + original indices
  const nonTerminalIndices: number[] = [];
  const nonTerminalFens: string[] = [];
  for (let i = 0; i < fens.length; i++) {
    if (!terminalEvals.has(i)) {
      nonTerminalIndices.push(i);
      nonTerminalFens.push(fens[i]);
    }
  }

  // 3) Progress
  const total = fens.length;
  let done = terminalEvals.size;
  const safeProgress = (d: number, t: number): void => {
    try {
      onProgress?.(d, t);
    } catch {
      // callback errors must not stop analysis
    }
  };
  if (terminalEvals.size > 0) safeProgress(done, total);

  // 4) Place terminal evals
  const evals: PositionEval[] = new Array(total);
  for (const [i, e] of terminalEvals) evals[i] = e;

  // 5) Evaluate non-terminal with concurrency
  if (nonTerminalFens.length > 0) {
    const results = await mapWithConcurrency(
      nonTerminalFens,
      concurrency,
      async (fen) => {
        const r = await evaluator(fen, depth);
        done++;
        safeProgress(done, total);
        return r;
      }
    );
    for (let k = 0; k < results.length; k++) {
      evals[nonTerminalIndices[k]] = results[k];
    }
  }

  // 6) Defensive: all evals must be filled
  for (let i = 0; i < total; i++) {
    if (!evals[i]) {
      throw new Error(`analyzePGN: missing eval for FEN index ${i}`);
    }
  }

  // 7) Pair adjacent evals (same reference for evalAfter[n] / evalBefore[n+1])
  const moves: MoveAnalysis[] = [];
  for (let n = 0; n < sans.length; n++) {
    moves.push({
      ply: n + 1,
      san: sans[n],
      fenBefore: fens[n],
      fenAfter: fens[n + 1],
      evalBefore: evals[n],
      evalAfter: evals[n + 1],
    });
  }

  return { headers, moves };
}


// ============ 6b.2b.1: retry + error helpers ============

export class AnalysisError extends Error {
  positionIndex: number;
  fen: string;
  constructor(message: string, positionIndex: number, fen: string) {
    super(message);
    this.name = "AnalysisError";
    this.positionIndex = positionIndex;
    this.fen = fen;
  }
}

/**
 * Detect an AbortError regardless of its concrete type.
 * Accepts DOMException, Error with name="AbortError", or a plain object
 * with name="AbortError". Everything else (including null, strings) is false.
 */
export function isAbortError(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  return (err as { name?: unknown }).name === "AbortError";
}

/**
 * Evaluate a FEN with one retry on failure.
 * - NO retry on AbortError or if signal.aborted at any point.
 * - If both attempts fail, throws a new Error whose `cause` is the SECOND
 *   error (the first is lost by design — keep it simple).
 * - If the first attempt succeeds, returns its result directly.
 */
export async function evalWithRetry(
  evaluator: Evaluator,
  fen: string,
  depth: number,
  signal?: AbortSignal
): Promise<PositionEval> {
  try {
    return await evaluator(fen, depth, signal);
  } catch (err) {
    if (isAbortError(err) || signal?.aborted) throw err;

    try {
      return await evaluator(fen, depth, signal);
    } catch (err2) {
      const wrapped =
        err2 instanceof Error
          ? new Error(err2.message, { cause: err2 })
          : new Error(String(err2), { cause: err2 });
      throw wrapped;
    }
  }
}
