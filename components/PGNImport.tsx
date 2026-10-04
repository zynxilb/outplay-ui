// components/PGNImport.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { MoveList } from "./MoveList";
import { StatsCard } from "./StatsCard";

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

type State =
  | { kind: "idle" }
  | { kind: "analyzing"; done: number; total: number }
  | { kind: "done"; headers: PGNHeaders; moves: ClassifiedMove[] }
  | { kind: "error"; message: string }
  | { kind: "cancelled" };

const COLORS = {
  bg: "#161512",
  surface: "#302E2B",
  border: "#3d3a37",
  text: "#bababa",
  muted: "#7d7a76",
  accent: "#81B64C",
  danger: "#B33430",
};

export function PGNImport() {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [text, setText] = useState("");
  const acRef = useRef<AbortController | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      acRef.current?.abort();
    };
  }, []);

  const handleAnalyze = async () => {
    const v = validatePgnInput(text);
    if (!v.ok) {
      setState({ kind: "error", message: pgnValidationMessageAr(v.reason) });
      return;
    }

    // Cancel any previous analysis
    acRef.current?.abort();
    const ac = new AbortController();
    acRef.current = ac;

    setState({ kind: "analyzing", done: 0, total: 0 });

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
      setState({
        kind: "done",
        headers,
        moves: toClassifiedMoves(moves),
      });
    } catch (err) {
      if (acRef.current !== ac) return;
      if (isAbortError(err) || ac.signal.aborted) {
        setState({ kind: "cancelled" });
      } else {
        setState({ kind: "error", message: toArabicError(err) });
      }
    } finally {
      if (acRef.current === ac) acRef.current = null;
    }
  };

  const handleCancel = () => {
    acRef.current?.abort();
  };

  const handleFile = async (file: File | null) => {
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
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const reset = () => {
    setState({ kind: "idle" });
    setText("");
  };

  const showInput = state.kind === "idle" || state.kind === "error" || state.kind === "cancelled";

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: COLORS.bg,
        color: COLORS.text,
        padding: "24px 16px",
        fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div style={{ maxWidth: "640px", margin: "0 auto" }}>
        <h1
          style={{
            fontSize: "22px",
            fontWeight: 600,
            marginBottom: "6px",
            color: "#e8e8e8",
          }}
        >
          حلل مباراتك
        </h1>
        <p style={{ color: COLORS.muted, fontSize: "13px", marginTop: 0, marginBottom: "24px" }}>
          الصق PGN من Chess.com أو Lichess، أو ارفع ملف
        </p>

        {showInput && (
          <>
            <textarea
              dir="ltr"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder='[Event "..."] 1. e4 e5 ...'
              spellCheck={false}
              style={{
                width: "100%",
                minHeight: "160px",
                background: COLORS.surface,
                color: COLORS.text,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "6px",
                padding: "12px",
                fontFamily: "monospace",
                fontSize: "12px",
                resize: "vertical",
                outline: "none",
              }}
            />

            <div
              style={{
                display: "flex",
                gap: "8px",
                marginTop: "12px",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={handleAnalyze}
                disabled={state.kind === "analyzing" || text.trim().length === 0}
                style={{
                  flex: "1 1 auto",
                  minWidth: "120px",
                  background: COLORS.accent,
                  color: "#161512",
                  border: "none",
                  borderRadius: "6px",
                  padding: "10px 16px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  opacity: text.trim().length === 0 ? 0.4 : 1,
                }}
              >
                حلل المباراة
              </button>

              <label
                style={{
                  background: "transparent",
                  color: COLORS.muted,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: "6px",
                  padding: "10px 16px",
                  fontSize: "13px",
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                ارفع ملف
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pgn,.txt"
                  style={{ display: "none" }}
                  onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>
          </>
        )}

        {state.kind === "analyzing" && (
          <div style={{ marginTop: "16px" }}>
            <div
              style={{
                height: "3px",
                background: COLORS.surface,
                borderRadius: "2px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  background: COLORS.accent,
                  width:
                    state.total > 0
                      ? `${(state.done / state.total) * 100}%`
                      : "0%",
                  transition: "width 0.2s",
                }}
              />
            </div>
            <p style={{ color: COLORS.muted, fontSize: "13px", marginTop: "10px" }}>
              {state.total > 0
                ? `بيتم التحليل... ${state.done} من ${state.total}`
                : "بيتم التحضير..."}
            </p>
            <button
              onClick={handleCancel}
              style={{
                background: "transparent",
                color: COLORS.muted,
                border: "none",
                fontSize: "13px",
                cursor: "pointer",
                padding: "6px 0",
              }}
            >
              إلغاء
            </button>
          </div>
        )}

        {state.kind === "error" && (
          <div
            style={{
              marginTop: "16px",
              padding: "12px",
              background: COLORS.surface,
              border: `1px solid ${COLORS.danger}`,
              borderRadius: "6px",
            }}
          >
            <p style={{ margin: 0, color: "#e8e8e8", fontSize: "14px" }}>
              {state.message}
            </p>
            <button
              onClick={reset}
              style={{
                marginTop: "10px",
                background: "transparent",
                color: COLORS.muted,
                border: "none",
                fontSize: "13px",
                cursor: "pointer",
                padding: "6px 0",
              }}
            >
              حاول تاني
            </button>
          </div>
        )}

        {state.kind === "cancelled" && (
          <div
            style={{
              marginTop: "16px",
              padding: "12px",
              background: COLORS.surface,
              border: `1px solid ${COLORS.border}`,
              borderRadius: "6px",
            }}
          >
            <p style={{ margin: 0, color: "#e8e8e8", fontSize: "14px" }}>
              اتلغى التحليل
            </p>
            <button
              onClick={reset}
              style={{
                marginTop: "10px",
                background: "transparent",
                color: COLORS.muted,
                border: "none",
                fontSize: "13px",
                cursor: "pointer",
                padding: "6px 0",
              }}
            >
              ابدأ من جديد
            </button>
          </div>
        )}

        {state.kind === "done" && (
          <div style={{ marginTop: "16px" }}>
            <div
              style={{
                padding: "12px",
                background: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "6px",
                marginBottom: "12px",
              }}
            >
              <p style={{ margin: 0, fontSize: "14px", color: "#e8e8e8" }}>
                {state.headers.white ?? "?"} ({state.headers.whiteElo ?? "?"}) ضد{" "}
                {state.headers.black ?? "?"} ({state.headers.blackElo ?? "?"})
              </p>
              <p style={{ margin: "6px 0 0", fontSize: "12px", color: COLORS.muted }}>
                تم تحليل {state.moves.length} نقلة
              </p>
            </div>

            <div style={{ marginBottom: "12px" }}>
              <StatsCard moves={state.moves} />
            </div>

            <MoveList moves={state.moves} />

            <button
              onClick={reset}
              style={{
                marginTop: "16px",
                background: "transparent",
                color: COLORS.muted,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "6px",
                padding: "8px 16px",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              ارفع مباراة تانية
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
