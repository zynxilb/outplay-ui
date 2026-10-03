// lib/see.ts
// Static Exchange Evaluation — ported from outplay_core.py.

import { Chess } from "chess.js";
import type { Square } from "chess.js";
import { attacksFrom } from "./attacks.ts";

export const PIECE_VALUES: Record<string, number> = {
  p: 1, n: 3, b: 3, r: 5, q: 9, k: 100,
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

/** All squares whose piece of `color` attacks `square` (pseudo-legal). */
export function attackers(chess: Chess, square: Square, color: "w" | "b"): Square[] {
  const result: Square[] = [];
  for (const sq of ALL_SQUARES) {
    const p = chess.get(sq);
    if (!p || p.color !== color) continue;
    if (attacksFrom(chess, sq).includes(square)) result.push(sq);
  }
  return result;
}

/**
 * SEE on `square` for `sideToMove`.
 * Positive = side_to_move nets material by initiating the exchange.
 */
export function see(chess: Chess, square: Square, sideToMove: "w" | "b"): number {
  const working = new Chess(chess.fen());
  const target = working.get(square);
  if (!target) return 0;

  const gains: number[] = [];
  let color: "w" | "b" = sideToMove;
  let currentValue = PIECE_VALUES[target.type];

  for (let depth = 0; depth < 16; depth++) {
    const atts = attackers(working, square, color);
    if (atts.length === 0) break;

    // Cheapest attacker
    let cheapest = atts[0];
    let cheapestVal = PIECE_VALUES[working.get(cheapest)!.type];
    for (const a of atts) {
      const v = PIECE_VALUES[working.get(a)!.type];
      if (v < cheapestVal) { cheapest = a; cheapestVal = v; }
    }

    const attacker = working.get(cheapest)!;
    gains.push(currentValue);

    const isPromo = attacker.type === "p" && (square[1] === "1" || square[1] === "8");
    currentValue = isPromo ? PIECE_VALUES["q"] : PIECE_VALUES[attacker.type];

    working.remove(square);
    working.remove(cheapest);
    working.put(isPromo ? { type: "q", color: attacker.color } : attacker, square);

    color = color === "w" ? "b" : "w";
  }

  if (gains.length === 0) return 0;
  let net = gains[gains.length - 1];
  for (let i = gains.length - 2; i >= 0; i--) {
    net = gains[i] - Math.max(0, net);
  }
  return net;
}

/** Material the opponent can win on `square` (>= 3 means a minor piece or more). */
export function sacrificeValue(chess: Chess, square: Square): number {
  const p = chess.get(square);
  if (!p) return 0;
  const opponent = p.color === "w" ? "b" : "w";
  return see(chess, square, opponent);
}
