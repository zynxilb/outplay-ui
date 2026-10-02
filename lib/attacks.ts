// lib/attacks.ts
// All squares attacked by the piece on `from`.
// chess.js doesn't expose this, so we compute it manually.

import type { Chess, Square } from "chess.js";

const KNIGHT_JUMPS: [number, number][] = [
  [-2, -1], [-2, 1], [-1, -2], [-1, 2],
  [1, -2], [1, 2], [2, -1], [2, 1],
];

const KING_STEPS: [number, number][] = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1], [0, 1],
  [1, -1], [1, 0], [1, 1],
];

const BISHOP_DIRS: [number, number][] = [
  [-1, -1], [-1, 1], [1, -1], [1, 1],
];

const ROOK_DIRS: [number, number][] = [
  [-1, 0], [1, 0], [0, -1], [0, 1],
];

function toSquare(file: number, rank: number): Square | null {
  if (file < 0 || file > 7 || rank < 0 || rank > 7) return null;
  return (String.fromCharCode(97 + file) + (rank + 1)) as Square;
}

export function attacksFrom(chess: Chess, from: Square): Square[] {
  const piece = chess.get(from);
  if (!piece) return [];

  const file = from.charCodeAt(0) - 97;
  const rank = parseInt(from[1], 10) - 1;
  const result: Square[] = [];

  if (piece.type === "p") {
    const dir = piece.color === "w" ? 1 : -1;
    for (const df of [-1, 1]) {
      const sq = toSquare(file + df, rank + dir);
      if (sq) result.push(sq);
    }
  } else if (piece.type === "n") {
    for (const [df, dr] of KNIGHT_JUMPS) {
      const sq = toSquare(file + df, rank + dr);
      if (sq) result.push(sq);
    }
  } else if (piece.type === "k") {
    for (const [df, dr] of KING_STEPS) {
      const sq = toSquare(file + df, rank + dr);
      if (sq) result.push(sq);
    }
  } else {
    const dirs: [number, number][] = [];
    if (piece.type === "b" || piece.type === "q") dirs.push(...BISHOP_DIRS);
    if (piece.type === "r" || piece.type === "q") dirs.push(...ROOK_DIRS);
    for (const [df, dr] of dirs) {
      let f = file + df;
      let r = rank + dr;
      while (true) {
        const sq = toSquare(f, r);
        if (!sq) break;
        result.push(sq);
        if (chess.get(sq)) break;
        f += df;
        r += dr;
      }
    }
  }

  return result;
}
