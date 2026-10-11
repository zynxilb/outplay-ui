// hooks/usePgnImport.ts
"use client";

import { useEffect, useRef, useState } from "react";

import {
  analyzePGN,
  buildPositions,
  isAbortError,
  makeApiEvaluator,
  startFenFromHeaders,
  toClassifiedMoves,
} from "@/lib/pgn-analysis";
import { parseMoves, type PGNHeaders } from "@/lib/pgn";
import { toArabicError } from "@/lib/pgn-errors-ar";
import {
  pgnValidationMessageAr,
  validatePgnInput,
} from "@/lib/pgn-validate";
import type { ClassifiedMove } from "@/lib/types";

export type PgnImportState =
  | { kind: "idle" }
  | {
      kind: "analyzing";
      done: number;
      total: number;
      currentFen?: string;
      currentSan?: string;
    }
  | { kind: "done"; headers: PGNHeaders; moves: ClassifiedMove[] }
  | { kind: "error"; message: string }
  | { kind: "cancelled" };

export interface UsePgnImport {
  state: PgnImportState;
  text: string;
  setText: (t: string) => void;
  analyze: () => Promise<void>;
  cancel: () => void;
  reset: () => void;
  loadFile: (file: File | null) => Promise<void>;
}

function track(event: string, data?: Record<string, unknown>) {
  if (typeof window !== "undefined" && window.umami) {
    window.umami.track(event, data);
  }
}

export function usePgnImport(): UsePgnImport {
  const [state, setState] = useState<PgnImportState>({ kind: "idle" });
  const [text, setText] = useState("");
  const acRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      acRef.current?.abort();
    };
  }, []);

  const analyze = async () => {
    const v = validatePgnInput(text);
    if (!v.ok) {
      setState({ kind: "error", message: pgnValidationMessageAr(v.reason) });
      return;
    }

    acRef.current?.abort();
    const ac = new AbortController();
    acRef.current = ac;

    // Pre-compute FENs so we can show the current position during analysis.
    let fens: string[] = [];
    let sans: string[] = [];
    try {
      sans = parseMoves(text);
      fens = buildPositions(sans, startFenFromHeaders(text));
    } catch {
      fens = [];
    }

    setState({
      kind: "analyzing",
      done: 0,
      total: sans.length,
      currentFen: fens[0],
    });

    const startedAt = Date.now();
    track("analysis_started");

    try {
      const { headers, moves } = await analyzePGN(text, {
        evaluator: makeApiEvaluator(),
        signal: ac.signal,
        onProgress: (done, total) => {
          if (acRef.current !== ac) return;
          const idx = Math.min(done, fens.length - 1);
          setState({
            kind: "analyzing",
            done,
            total,
            currentFen: fens[idx],
            currentSan: done > 0 ? sans[done - 1] : undefined,
          });
        },
      });

      if (acRef.current !== ac) return;

      const classified = toClassifiedMoves(moves);
      track("analysis_completed", {
        moves_count: moves.length,
        duration_ms: Date.now() - startedAt,
        brilliants: classified.filter((m) => m.classification === "Brilliant")
          .length,
        blunders: classified.filter((m) => m.classification === "Blunder")
          .length,
      });

      setState({
        kind: "done",
        headers,
        moves: classified,
      });
    } catch (err) {
      if (acRef.current !== ac) return;
      if (isAbortError(err) || ac.signal.aborted) {
        track("analysis_cancelled", { duration_ms: Date.now() - startedAt });
        setState({ kind: "cancelled" });
      } else {
        track("analysis_failed", {
          reason: err instanceof Error ? err.name : "unknown",
          duration_ms: Date.now() - startedAt,
        });
        setState({ kind: "error", message: toArabicError(err) });
      }
    } finally {
      if (acRef.current === ac) acRef.current = null;
    }
  };

  const cancel = () => {
    acRef.current?.abort();
  };

  const reset = () => {
    setState({ kind: "idle" });
    setText("");
  };

  const loadFile = async (file: File | null) => {
    if (!file) return;
    try {
      if (file.size > 1_000_000) {
        setState({
          kind: "error",
          message: pgnValidationMessageAr("too-large"),
        });
        return;
      }
      const fileText = await file.text();
      setText(fileText);
      setState({ kind: "idle" });
    } catch {
      setState({ kind: "error", message: "مش قادر أقرا الملف، حاول تاني" });
    }
  };

  return { state, text, setText, analyze, cancel, reset, loadFile };
}
