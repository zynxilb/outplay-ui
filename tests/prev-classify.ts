// tests/prev-classify.ts
// Frozen snapshot of lib/classify.ts BEFORE basis-point conversion.
// Used for comparison only. Not used by the app.

// lib/classify.ts
// Pure classification logic. No imports.

export type MoveClassification =
  | "Brilliant"
  | "Great"
  | "Best"
  | "Excellent"
  | "Good"
  | "Book"
  | "Inaccuracy"
  | "Mistake"
  | "Miss"
  | "Blunder";

export type ClassifyInput = {
  isBest: boolean;
  isBook: boolean;
  isSacrifice: boolean;
  evalBefore: number;
  evalAfter: number;
  secondBestEval: number | null;
  moverColor: "w" | "b";
  prevOppEpLoss?: number | null;
  legalMoves?: number;
};

/** Lichess S-curve: cp -> win probability (0-100). */
export function winPercent(cp: number): number {
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);
}

/** Expected Points: win probability normalised to 0-1. */
export function expectedPoints(cp: number): number {
  return winPercent(cp) / 100;
}

export function prevClassifyMove(input: ClassifyInput): MoveClassification {
  const {
    isBest,
    isBook,
    isSacrifice: sacrifice,
    evalBefore,
    evalAfter,
    secondBestEval,
    moverColor,
    prevOppEpLoss = null,
    legalMoves = 30,
  } = input;

  if (isBook) return "Book";

  const moverBefore = moverColor === "w" ? evalBefore : -evalBefore;
  const moverAfter = moverColor === "w" ? evalAfter : -evalAfter;

  const epBefore = expectedPoints(moverBefore);
  const epAfter = expectedPoints(moverAfter);
  const epLoss = Math.max(0, epBefore - epAfter);

  // Miss: was winning, gave it away, opponent blundered previously,
  // and we're still not losing (else it's a Blunder).
  const wasWinning = epBefore >= 0.7;
  const gaveItAway = epAfter <= 0.55;
  const bigLoss = epLoss >= 0.15;
  const opponentBlundered = prevOppEpLoss !== null && prevOppEpLoss >= 0.1;
  const stillNotLosing = epAfter >= 0.3;

  if (wasWinning && gaveItAway && bigLoss && opponentBlundered && stillNotLosing) {
    return "Miss";
  }

  // Brilliant: best (or near-best) move + sacrifice + still reasonable.
  const isNearBest = isBest || epLoss <= 0.02;
  if (isNearBest && sacrifice && epAfter >= 0.5 && epBefore < 0.9) {
    return "Brilliant";
  }

  // Great: best move + category-boundary crossing. Skip forced moves.
  if (isBest && secondBestEval !== null && legalMoves > 1) {
    const moverSecond = moverColor === "w" ? secondBestEval : -secondBestEval;
    const epSecond = expectedPoints(moverSecond);
    const gap = epBefore - epSecond;
    const crossesWin = epBefore >= 0.7 && epSecond < 0.7;
    const crossesLoss = epBefore >= 0.3 && epSecond < 0.3;
    if (gap >= 0.1 && (crossesWin || crossesLoss)) return "Great";
  }

  if (isBest) return "Best";
  if (epLoss <= 0.02) return "Excellent";
  if (epLoss <= 0.05) return "Good";
  if (epLoss <= 0.1) return "Inaccuracy";
  if (epLoss <= 0.2) return "Mistake";
  return "Blunder";
}
