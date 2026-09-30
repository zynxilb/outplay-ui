// hooks/useStockfishEval.ts
"use client";

import { useEffect, useState } from "react";
import { fetchEvalFromServer } from "@/lib/chess-helpers";

type UseStockfishEvalResult = {
  /** Centipawns from white's perspective. */
  evalCp: number;
  /** True once the first warm-up call has completed successfully. */
  engineReady: boolean;
  /** True while an evaluation for the current position is in flight. */
  loading: boolean;
};

const STARTING_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/**
 * Warms up the Stockfish API on mount, then re-evaluates whenever the
 * given FEN changes.
 */
export function useStockfishEval(
  fen: string,
  depth = 10
): UseStockfishEvalResult {
  const [evalCp, setEvalCp] = useState(0);
  const [engineReady, setEngineReady] = useState(false);
  const [loading, setLoading] = useState(false);

  // Warm-up call.
  useEffect(() => {
    let cancelled = false;

    fetchEvalFromServer(STARTING_FEN, depth)
      .then(() => {
        if (!cancelled) setEngineReady(true);
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

    let cancelled = false;
    setLoading(true);

    fetchEvalFromServer(fen, depth).then((cp) => {
      if (cancelled) return;
      setEvalCp(cp);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [engineReady, fen, depth]);

  return { evalCp, engineReady, loading };
}
