// lib/motifs.ts
// Detects tactical motifs. Ported from motifs.py.
// Currently supports: Fork.

import type { Chess, Square } from "chess.js";
import { attacksFrom } from "./attacks";

const PIECE_VALUES: Record<string, number> = {
  p: 1, n: 3, b: 3, r: 5, q: 9, k: 100,
};

export type ForkTarget = {
  square: Square;
  piece: string;
  value: number;
};

export type Fork = {
  from: Square;
  piece: string;
  targets: ForkTarget[];
  numTargets: number;
  hasKing: boolean;
  totalValue: number;
};

const ALL_SQUARES: Square[] = (() => {
  const out: Square[] = [];
  for (let r = 1; r <= 8; r++) {
    for (let f = 0; f < 8; f++) {
      out.push((String.fromCharCode(97 + f) + r) as Square);
    }
  }
  return out;
})();

export function detectForks(chess: Chess, attackerColor: "w" | "b"): Fork[] {
  const forks: Fork[] = [];
  const enemy = attackerColor === "w" ? "b" : "w";

  for (const sq of ALL_SQUARES) {
    const piece = chess.get(sq);
    if (!piece || piece.color !== attackerColor) continue;
    if (piece.type === "k" || piece.type === "p") continue;

    const targets: ForkTarget[] = [];
    for (const tsq of attacksFrom(chess, sq)) {
      const tp = chess.get(tsq);
      if (tp && tp.color === enemy) {
        targets.push({
          square: tsq,
          piece: tp.type,
          value: PIECE_VALUES[tp.type] ?? 0,
        });
      }
    }

    if (targets.length < 2) continue;

    const values = targets.map((t) => t.value);
    const hasKing = targets.some((t) => t.piece === "k");
    const hasHeavy = values.some((v) => v >= 5);
    const minorCount = values.filter((v) => v === 3).length;

    if (!(hasKing || hasHeavy || minorCount >= 2)) continue;

    targets.sort((a, b) => b.value - a.value);

    forks.push({
      from: sq,
      piece: piece.type,
      targets,
      numTargets: targets.length,
      hasKing,
      totalValue: values.reduce((a, b) => a + b, 0),
    });
  }

  return forks;
}


// ===== Pin & Skewer detection =====

const SLIDING = ["b", "r", "q"];

function walkToNextPiece(
  chess: Chess,
  start: Square,
  df: number,
  dr: number
): { square: Square; piece: { type: string; color: "w" | "b" } } | null {
  let f = start.charCodeAt(0) - 97 + df;
  let r = parseInt(start[1], 10) - 1 + dr;
  while (f >= 0 && f <= 7 && r >= 0 && r <= 7) {
    const sq = (String.fromCharCode(97 + f) + (r + 1)) as Square;
    const p = chess.get(sq);
    if (p) return { square: sq, piece: p };
    f += df;
    r += dr;
  }
  return null;
}

function direction(from: Square, to: Square): [number, number] | null {
  const df = to.charCodeAt(0) - from.charCodeAt(0);
  const dr = parseInt(to[1], 10) - parseInt(from[1], 10);
  if (df !== 0 && dr !== 0 && Math.abs(df) !== Math.abs(dr)) return null;
  return [
    df === 0 ? 0 : df > 0 ? 1 : -1,
    dr === 0 ? 0 : dr > 0 ? 1 : -1,
  ];
}

export type PinOrSkewer = {
  from: Square;
  piece: string;
  front: Square;
  frontPiece: string;
  frontValue: number;
  back: Square;
  backPiece: string;
  backValue: number;
  isAbsolute: boolean;
};

export function detectPins(
  chess: Chess,
  attackerColor: "w" | "b"
): PinOrSkewer[] {
  const pins: PinOrSkewer[] = [];
  const enemy = attackerColor === "w" ? "b" : "w";

  for (const sq of ALL_SQUARES) {
    const piece = chess.get(sq);
    if (!piece || piece.color !== attackerColor) continue;
    if (!SLIDING.includes(piece.type)) continue;

    for (const tsq of attacksFrom(chess, sq)) {
      const tp = chess.get(tsq);
      if (!tp || tp.color !== enemy) continue;

      const dir = direction(sq, tsq);
      if (!dir) continue;

      const behind = walkToNextPiece(chess, tsq, dir[0], dir[1]);
      if (!behind || behind.piece.color !== enemy) continue;

      const frontVal = PIECE_VALUES[tp.type] ?? 0;
      const backVal = PIECE_VALUES[behind.piece.type] ?? 0;

      // Pin: back piece is more valuable than front
      if (backVal <= frontVal) continue;

      const isAbsolute = behind.piece.type === "k";
      // Skip pinned pawns (not meaningful) unless absolute
      if (tp.type === "p" && !isAbsolute) continue;
      // Skip if back piece is a pawn
      if (behind.piece.type === "p") continue;

      pins.push({
        from: sq,
        piece: piece.type,
        front: tsq,
        frontPiece: tp.type,
        frontValue: frontVal,
        back: behind.square,
        backPiece: behind.piece.type,
        backValue: backVal,
        isAbsolute,
      });
    }
  }
  return pins;
}

export function detectSkewers(
  chess: Chess,
  attackerColor: "w" | "b"
): PinOrSkewer[] {
  const skewers: PinOrSkewer[] = [];
  const enemy = attackerColor === "w" ? "b" : "w";

  for (const sq of ALL_SQUARES) {
    const piece = chess.get(sq);
    if (!piece || piece.color !== attackerColor) continue;
    if (!SLIDING.includes(piece.type)) continue;

    for (const tsq of attacksFrom(chess, sq)) {
      const tp = chess.get(tsq);
      if (!tp || tp.color !== enemy) continue;

      const dir = direction(sq, tsq);
      if (!dir) continue;

      const behind = walkToNextPiece(chess, tsq, dir[0], dir[1]);
      if (!behind || behind.piece.color !== enemy) continue;

      const frontVal = PIECE_VALUES[tp.type] ?? 0;
      const backVal = PIECE_VALUES[behind.piece.type] ?? 0;

      // Skewer: front piece is MORE valuable than back
      if (frontVal <= backVal) continue;
      // Back piece must be worth at least 3 (minor piece)
      if (backVal < 3) continue;

      skewers.push({
        from: sq,
        piece: piece.type,
        front: tsq,
        frontPiece: tp.type,
        frontValue: frontVal,
        back: behind.square,
        backPiece: behind.piece.type,
        backValue: backVal,
        isAbsolute: tp.type === "k",
      });
    }
  }
  return skewers;
}
