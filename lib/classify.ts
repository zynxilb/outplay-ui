// lib/classify.ts
// Pure classification logic. No imports.

export type MoveClassification =
  | "Brilliant" | "Great" | "Best" | "Excellent" | "Good"
  | "Book" | "Inaccuracy" | "Mistake" | "Miss" | "Blunder";

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

// ===== Basis points (0-10000). All thresholds below are integers. =====
const BP_SCALE = 10000;
const bp = (x: number): number => Math.round(x * BP_SCALE);

// Classification thresholds
const EXCELLENT_MAX = 200;
const GOOD_MAX = 500;
const INACCURACY_MAX = 1000;
const MISTAKE_MAX = 2000;

// Miss thresholds
const MISS_WAS_WINNING = 7000;
const MISS_GAVE_IT_AWAY = 5500;
const MISS_BIG_LOSS = 1500;
const MISS_STILL_NOT_LOSING = 3000;
const MISS_PREV_OPP_BLUNDER = 1000;

// Brilliant thresholds
const NEAR_BEST_MAX = 200;       // distinct from EXCELLENT_MAX by meaning
const BRILLIANT_EP_AFTER_MIN = 5000;

// Great thresholds
const GREAT_GAP_MIN = 1000;
const GREAT_CROSSES_WIN = 7000;
const GREAT_CROSSES_LOSS = 3000;

/**
 * Expected-points loss by the mover.
 * @returns ep loss in [0, 1] (same units as `prevOppEpLoss`).
 */
export function epLossFor(input: ClassifyInput): number {
  const { evalBefore, evalAfter, moverColor } = input;
  const moverBefore = moverColor === "w" ? evalBefore : -evalBefore;
  const moverAfter = moverColor === "w" ? evalAfter : -evalAfter;
  const epBefore = expectedPoints(moverBefore);
  const epAfter = expectedPoints(moverAfter);
  return Math.max(0, epBefore - epAfter);
}

export function classifyMove(input: ClassifyInput): MoveClassification {
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

  const epBefore = bp(expectedPoints(moverBefore));
  const epAfter = bp(expectedPoints(moverAfter));
  const epLoss = bp(epLossFor(input));

  const prevOppBp = prevOppEpLoss === null ? null : bp(prevOppEpLoss);

  // Miss: was winning, gave it away, opponent blundered previously,
  // and we are still not losing (else it falls through to Mistake/Blunder).
  const wasWinning = epBefore >= MISS_WAS_WINNING;
  const gaveItAway = epAfter <= MISS_GAVE_IT_AWAY;
  const bigLoss = epLoss >= MISS_BIG_LOSS;
  const opponentBlundered =
    prevOppBp !== null && prevOppBp >= MISS_PREV_OPP_BLUNDER;
  const stillNotLosing = epAfter >= MISS_STILL_NOT_LOSING;

  if (wasWinning && gaveItAway && bigLoss && opponentBlundered && stillNotLosing) {
    return "Miss";
  }

  // Brilliant: best (or near-best) move + sacrifice + still reasonable.
  const isNearBest = isBest || epLoss <= NEAR_BEST_MAX;
  if (
    isNearBest &&
    sacrifice &&
    epAfter >= BRILLIANT_EP_AFTER_MIN
  ) {
    return "Brilliant";
  }

  // Great: best move + category-boundary crossing. Skip forced moves.
  if (isBest && secondBestEval !== null && legalMoves > 1) {
    const moverSecond =
      moverColor === "w" ? secondBestEval : -secondBestEval;
    const epSecond = bp(expectedPoints(moverSecond));
    const gap = epBefore - epSecond;
    const crossesWin =
      epBefore >= GREAT_CROSSES_WIN && epSecond < GREAT_CROSSES_WIN;
    const crossesLoss =
      epBefore >= GREAT_CROSSES_LOSS && epSecond < GREAT_CROSSES_LOSS;
    if (gap >= GREAT_GAP_MIN && (crossesWin || crossesLoss)) return "Great";
  }

  if (isBest) return "Best";
  if (epLoss <= EXCELLENT_MAX) return "Excellent";
  if (epLoss <= GOOD_MAX) return "Good";
  if (epLoss <= INACCURACY_MAX) return "Inaccuracy";
  if (epLoss <= MISTAKE_MAX) return "Mistake";
  return "Blunder";
}
