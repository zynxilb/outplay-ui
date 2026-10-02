// hooks/useMoveHistory.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Move } from "chess.js";
import {
  normaliseFenForOpening,
  classifyMove,
  expectedPoints,
} from "@/lib/chess-helpers";
import type { EvalResult } from "@/lib/chess-helpers";
import type { ClassifiedMove, OpeningBook } from "@/lib/types";

type PendingMove = {
  move: Move;
  fenBefore: string;
  fenAfter: string;
  isSacrifice: boolean;
};

type UseMoveHistoryOptions = {
  fen: string;
  evaluatedFen: string | null;
  engineReady: boolean;
  cacheVersion: number;
  openingBook: OpeningBook | null;
  getEvalForFen: (fen: string) => EvalResult | null;
};

export function useMoveHistory({
  fen,
  evaluatedFen,
  engineReady,
  cacheVersion,
  openingBook,
  getEvalForFen,
}: UseMoveHistoryOptions) {
  const [moves, setMoves] = useState<ClassifiedMove[]>([]);
  const pendingRef = useRef<PendingMove | null>(null);

  const recordMove = useCallback(
    (
      move: Move,
      fenBefore: string,
      fenAfter: string,
      isSacrifice: boolean
    ) => {
      pendingRef.current = { move, fenBefore, fenAfter, isSacrifice };
    },
    []
  );

  const reset = useCallback(() => {
    setMoves([]);
    pendingRef.current = null;
  }, []);

  useEffect(() => {
    if (!engineReady) return;
    const pending = pendingRef.current;
    if (!pending) return;
    if (pending.fenAfter !== fen) return;
    if (evaluatedFen !== fen) return;

    const evalBefore = getEvalForFen(pending.fenBefore);
    const evalAfter = getEvalForFen(pending.fenAfter);
    if (!evalBefore || !evalAfter) return;

    const playedUci =
      pending.move.from +
      pending.move.to +
      (pending.move.promotion ?? "");
    const isBest = evalBefore.bestMove === playedUci;

    const bookKey = normaliseFenForOpening(pending.fenAfter);
    const isBook = openingBook ? bookKey in openingBook : false;

    setMoves((prev) => {
      let prevOppEpLoss = 1;
      if (prev.length > 0) {
        const last = prev[prev.length - 1];
        const lastBefore =
          last.color === "w" ? last.evalBefore : -last.evalBefore;
        const lastAfter =
          last.color === "w" ? last.evalAfter : -last.evalAfter;
        prevOppEpLoss = Math.max(
          0,
          expectedPoints(lastBefore) - expectedPoints(lastAfter)
        );
      }

      return [
        ...prev,
        {
          ply: prev.length + 1,
          san: pending.move.san,
          from: pending.move.from,
          to: pending.move.to,
          color: pending.move.color,
          classification: classifyMove({
            isBest,
            isBook,
            isSacrifice: pending.isSacrifice,
            evalBefore: evalBefore.score,
            evalAfter: evalAfter.score,
            secondBestEval: evalBefore.secondScore,
            moverColor: pending.move.color,
            prevOppEpLoss,
          }),
          evalBefore: evalBefore.score,
          evalAfter: evalAfter.score,
        },
      ];
    });
    pendingRef.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen, evaluatedFen, engineReady, cacheVersion]);

  return { moves, recordMove, reset };
}
