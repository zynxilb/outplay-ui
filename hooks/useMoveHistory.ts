// hooks/useMoveHistory.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Move } from "chess.js";
import { Chess } from "chess.js";
import {
  normaliseFenForOpening,
  classifyMove,
  expectedPoints,
} from "@/lib/chess-helpers";
import { detectForks, detectPins, detectSkewers } from "@/lib/motifs";
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
  const pendingQueueRef = useRef<PendingMove[]>([]);

  const recordMove = useCallback(
    (
      move: Move,
      fenBefore: string,
      fenAfter: string,
      isSacrifice: boolean
    ) => {
      pendingQueueRef.current.push({ move, fenBefore, fenAfter, isSacrifice });
    },
    []
  );

  const reset = useCallback(() => {
    setMoves([]);
    pendingQueueRef.current = [];
  }, []);

  useEffect(() => {
    if (!engineReady) return;
    const queue = pendingQueueRef.current;
    if (queue.length === 0) return;

    // Process pending moves in order. Stop at the first whose evals aren't ready.
    const toProcess: PendingMove[] = [];
    for (const p of queue) {
      const eb = getEvalForFen(p.fenBefore);
      const ea = getEvalForFen(p.fenAfter);
      if (!eb || !ea) break;
      toProcess.push(p);
    }
    if (toProcess.length === 0) return;

    pendingQueueRef.current = queue.slice(toProcess.length);

    setMoves((prev) => {
      const newMoves: ClassifiedMove[] = [];
      let prevOppEpLoss = 1;
      let lastPly = prev.length;

      if (prev.length > 0) {
        const last = prev[prev.length - 1];
        const lb = last.color === "w" ? last.evalBefore : -last.evalBefore;
        const la = last.color === "w" ? last.evalAfter : -last.evalAfter;
        prevOppEpLoss = Math.max(0, expectedPoints(lb) - expectedPoints(la));
      }

      for (const pending of toProcess) {
        const eb = getEvalForFen(pending.fenBefore);
        const ea = getEvalForFen(pending.fenAfter);
        if (!eb || !ea) break;

        const playedUci =
          pending.move.from +
          pending.move.to +
          (pending.move.promotion ?? "");
        const isBest = eb.bestMove === playedUci;
        const bookKey = normaliseFenForOpening(pending.fenAfter);
        const isBook = openingBook ? bookKey in openingBook : false;

        let motifs: string[] = [];
        try {
          const after = new Chess(pending.fenAfter);
          const lastTo = pending.move.to;

          const forks = detectForks(after, pending.move.color);
          if (forks.some((f) => f.from === lastTo)) motifs.push("fork");

          const pins = detectPins(after, pending.move.color);
          if (pins.some((p) => p.from === lastTo)) motifs.push("pin");

          const skewers = detectSkewers(after, pending.move.color);
          if (skewers.some((s) => s.from === lastTo)) motifs.push("skewer");
        } catch {
          motifs = [];
        }

        lastPly += 1;
        newMoves.push({
          ply: lastPly,
          san: pending.move.san,
          from: pending.move.from,
          to: pending.move.to,
          color: pending.move.color,
          classification: classifyMove({
            isBest,
            isBook,
            isSacrifice: pending.isSacrifice,
            evalBefore: eb.score,
            evalAfter: ea.score,
            secondBestEval: eb.secondScore,
            moverColor: pending.move.color,
            prevOppEpLoss,
          }),
          evalBefore: eb.score,
          evalAfter: ea.score,
          motifs,
        });

        const mb = pending.move.color === "w" ? eb.score : -eb.score;
        const ma = pending.move.color === "w" ? ea.score : -ea.score;
        prevOppEpLoss = Math.max(0, expectedPoints(mb) - expectedPoints(ma));
      }

      return [...prev, ...newMoves];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen, evaluatedFen, engineReady, cacheVersion]);

  return { moves, recordMove, reset };
}
