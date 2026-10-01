// lib/sacrifice-detector.ts
// Detects whether a move sacrifices material for compensation.

import { Chess } from "chess.js";

const PIECE_VALUES: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

/**
 * Returns true if the given move leaves a valuable piece (knight or higher)
 * on a square that is attacked by the opponent and not defended by us.
 *
 * This matches Chess.com's Brilliant detection criterion of "a piece sacrifice".
 *
 * @param fenBefore The position before the move.
 * @param moveUci The move in UCI notation (e.g. "e2e4" or "e7e8q").
 */
export function isSacrifice(fenBefore: string, moveUci: string): boolean {
  if (moveUci.length < 4) return false;

  const chess = new Chess(fenBefore);
  const from = moveUci.slice(0, 2) as never;
  const to = moveUci.slice(2, 4) as never;
  const promotion = (moveUci.length > 4 ? moveUci[4] : undefined) as
    | never
    | undefined;

  try {
    const result = chess.move({ from, to, promotion });
    if (!result) return false;

    const movedValue = PIECE_VALUES[result.piece] ?? 0;
    if (movedValue < 3) return false;

    const opponentColor = result.color === "w" ? "b" : "w";
    const attacked = chess.isAttacked(to, opponentColor);
    if (!attacked) return false;

    const defenders = chess.attackers(to, result.color);
    return defenders.length === 0;
  } catch {
    return false;
  }
}
