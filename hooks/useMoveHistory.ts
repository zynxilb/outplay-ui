// hooks/useMoveHistory.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Move } from "chess.js";
import {
  normaliseFenForOpening,
  classifyMove,
} from "@/lib/chess-helpers";
import type { EvalResult } from "@/lib/chess-helpers";
import type { ClassifiedMove, OpeningBook } from "@/lib/types";

type PendingMove = {
  move: Move;
  fenBefore: string;
  fenAfter: string;
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
    (move: Move, fenBefore: string, fenAfter: string) => {
      pendingRef.current = { move, fenBefore, fenAfter };
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

    const isWhite = pending.move.color === "w";
    const cpLoss = isWhite
      ? Math.max(0, evalBefore.score - evalAfter.score)
      : Math.max(0, evalAfter.score - evalBefore.score);

    const playedUci =
      pending.move.from +
      pending.move.to +
      (pending.move.promotion ?? "");
    const isBest = evalBefore.bestMove === playedUci;

    const bookKey = normaliseFenForOpening(pending.fenAfter);
    const isBook = openingBook ? bookKey in openingBook : false;

    setMoves((prev) => [
      ...prev,
      {
        ply: prev.length + 1,
        san: pending.move.san,
        from: pending.move.from,
        to: pending.move.to,
        color: pending.move.color,
        cpLoss,
        classification: classifyMove({
          cpLoss,
          isBest,
          isBook,
          evalBefore: evalBefore.score,
          evalAfter: evalAfter.score,
          moverColor: pending.move.color,
        }),
        evalBefore: evalBefore.score,
        evalAfter: evalAfter.score,
      },
    ]);
    pendingRef.current = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen, evaluatedFen, engineReady, cacheVersion]);

  return { moves, recordMove, reset };
}
