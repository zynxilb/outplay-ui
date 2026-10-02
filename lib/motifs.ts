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
