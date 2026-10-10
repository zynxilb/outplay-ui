// lib/sacrifice-detector.ts
// Detects whether a move sacrifices material, using SEE (Static Exchange
// Evaluation) rather than geometric heuristics.

import { Chess } from "chess.js";
import type { Square } from "chess.js";
import { sacrificeValue, PIECE_VALUES } from "./see.ts";

const MIN_SACRIFICE_LOSS = 1.5;

export type SacrificeResult = {
  isSacrifice: boolean;
  materialLoss: number;
  capturedValue: number;
};

const EMPTY: SacrificeResult = {
  isSacrifice: false,
  materialLoss: 0,
  capturedValue: 0,
};

export function detectSacrifice(
  fenBefore: string,
  moveUci: string
): SacrificeResult {
  if (moveUci.length < 4) return EMPTY;

  const chess = new Chess(fenBefore);
  const from = moveUci.slice(0, 2) as Square;
  const to = moveUci.slice(2, 4) as Square;
  const promotion = moveUci.length > 4
    ? (moveUci[4] as "q" | "r" | "b" | "n")
    : undefined;

  const targetBefore = chess.get(to);
  const capturedValue = targetBefore
    ? PIECE_VALUES[targetBefore.type] ?? 0
    : 0;

  let result;
  try {
    result = chess.move({ from, to, promotion });
  } catch {
    return EMPTY;
  }
  if (!result) return EMPTY;

  const opponentGain = sacrificeValue(chess, to);
  const materialLoss = Math.max(0, opponentGain - capturedValue);

  return {
    isSacrifice: materialLoss >= MIN_SACRIFICE_LOSS,
    materialLoss,
    capturedValue,
  };
}

export function isSacrifice(fenBefore: string, moveUci: string): boolean {
  return detectSacrifice(fenBefore, moveUci).isSacrifice;
}
