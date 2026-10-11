// hooks/usePgnImport.ts
"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import {
  analyzePGN,
  isAbortError,
  makeApiEvaluator,
  toClassifiedMoves,
} from "@/lib/pgn-analysis";
import type { PGNHeaders } from "@/lib/pgn";
import { toArabicError } from "@/lib/pgn-errors-ar";
import {
  pgnValidationMessageAr,
  validatePgnInput,
} from "@/lib/pgn-validate";
import type { ClassifiedMove } from "@/lib/types";

export type PgnImportState =
  | { kind: "idle" }
  | { kind: "analyzing"; done: number; total: number }
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

    setState({ kind: "analyzing", done: 0, total: 0 });

    const startedAt = Date.now();
    track("analysis_started");

    try {
      const { headers, moves } = await analyzePGN(text, {
        evaluator: makeApiEvaluator(),
        signal: ac.signal,
        onProgress: (done, total) => {
          if (acRef.current !== ac) return;
          setState({ kind: "analyzing", done, total });
        },
      });

      if (acRef.current !== ac) return;

      const classified = toClassifiedMoves(moves);
      track("analysis_completed", {
        moves_count: moves.length,
        duration_ms: Date.now() - startedAt,
        brilliants: classified.filter((m) => m.classification === "Brilliant").length,
        blunders: classified.filter((m) => m.classification === "Blunder").length,
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
        setState({ kind: "error", message: pgnValidationMessageAr("too-large") });
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
