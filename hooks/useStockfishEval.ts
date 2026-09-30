// hooks/useStockfishEval.ts
"use client";

import { useEffect, useRef, useState } from "react";
import { fetchEvalFromServer } from "@/lib/chess-helpers";
import type { EvalResult } from "@/lib/chess-helpers";

type UseStockfishEvalResult = {
  evalCp: number;
  bestMove: string | null;
  evaluatedFen: string | null;
  engineReady: boolean;
  loading: boolean;
  cacheVersion: number;
  getEvalForFen: (fen: string) => EvalResult | null;
};

const STARTING_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export function useStockfishEval(
  fen: string,
  depth = 12
): UseStockfishEvalResult {
  const [evalCp, setEvalCp] = useState(0);
  const [bestMove, setBestMove] = useState<string | null>(null);
  const [evaluatedFen, setEvaluatedFen] = useState<string | null>(null);
  const [engineReady, setEngineReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cacheVersion, setCacheVersion] = useState(0);
  const requestIdRef = useRef(0);
  const cacheRef = useRef<Map<string, EvalResult>>(new Map());

  // Warm-up call.
  useEffect(() => {
    let cancelled = false;
    fetchEvalFromServer(STARTING_FEN, depth)
      .then((result) => {
        if (cancelled) return;
        cacheRef.current.set(STARTING_FEN, result);
        setCacheVersion((v) => v + 1);
        setEngineReady(true);
      })
      .catch(() => {
        if (!cancelled) setEngineReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, [depth]);

  // Evaluate every FEN change once the engine is ready.
  useEffect(() => {
    if (!engineReady) return;

    const requestId = ++requestIdRef.current;
    setLoading(true);

    fetchEvalFromServer(fen, depth).then((result) => {
      // Always cache the result, even if a newer request has superseded it.
      cacheRef.current.set(fen, result);
      setCacheVersion((v) => v + 1);
      if (requestId !== requestIdRef.current) return;
      setEvalCp(result.score);
      setBestMove(result.bestMove);
      setEvaluatedFen(fen);
      setLoading(false);
    });
  }, [engineReady, fen, depth]);

  const getEvalForFen = (targetFen: string): EvalResult | null => {
    return cacheRef.current.get(targetFen) ?? null;
  };

  return {
    evalCp,
    bestMove,
    evaluatedFen,
    engineReady,
    loading,
    cacheVersion,
    getEvalForFen,
  };
}
