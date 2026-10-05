// components/PGNImport.tsx
"use client";

import { useRef } from "react";
import { usePgnImport } from "@/hooks/usePgnImport";
import { MoveList } from "./MoveList";
import { StatsCard } from "./StatsCard";

const C = {
  bg: "#FAFAF8",
  text: "#1A1A1A",
  muted: "#6B6B6B",
  subtle: "#9A9A9A",
  border: "#E5E5E2",
  surface: "#FFFFFF",
  danger: "#C0392B",
  dangerBg: "#FEF5F4",
};

export function PGNImport() {
  const { state, text, setText, analyze, cancel, reset, loadFile } =
    usePgnImport();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const kind = state.kind;
  const showInput =
    kind === "idle" || kind === "error" || kind === "cancelled";

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100dvh",
        background: C.bg,
        color: C.text,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <div
        style={{
          maxWidth: 680,
          margin: "0 auto",
          padding: "clamp(32px, 8vh, 96px) 20px 80px",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(28px, 5vw, 36px)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            lineHeight: 1.25,
            margin: 0,
          }}
        >
          حلل مباراتك
        </h1>
        <p
          style={{
            color: C.muted,
            fontSize: 15,
            lineHeight: 1.7,
            marginTop: 12,
            marginBottom: 40,
          }}
        >
          الصق PGN من Chess.com أو Lichess، أو ارفع ملف.
        </p>

        {showInput && (
          <>
            <textarea
              dir="ltr"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder='[Event "..."] 1. e4 e5 2. Nf3 ...'
              spellCheck={false}
              style={{
                width: "100%",
                minHeight: 180,
                background: C.surface,
                color: C.text,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: 16,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: 15,
                lineHeight: 1.6,
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box",
              }}
            />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginTop: 20,
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={analyze}
                disabled={text.trim().length === 0}
                style={{
                  height: 44,
                  padding: "0 24px",
                  background: C.text,
                  color: C.bg,
                  border: "none",
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 500,
                  fontFamily: "inherit",
                  cursor:
                    text.trim().length === 0 ? "not-allowed" : "pointer",
                  opacity: text.trim().length === 0 ? 0.35 : 1,
                }}
              >
                حلل
              </button>

              <label
                style={{
                  color: C.muted,
                  fontSize: 14,
                  cursor: "pointer",
                  textDecoration: "underline",
                  textUnderlineOffset: 4,
                }}
              >
                أو ارفع ملف
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pgn,.txt"
                  style={{ display: "none" }}
                  onChange={(e) => loadFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>

            {kind === "error" && (
              <div
                style={{
                  marginTop: 24,
                  padding: "14px 16px",
                  background: C.dangerBg,
                  borderInlineStart: `3px solid ${C.danger}`,
                  borderRadius: 4,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    color: C.danger,
                    fontSize: 14,
                    lineHeight: 1.6,
                  }}
                >
                  {state.message}
                </p>
                <button
                  type="button"
                  onClick={reset}
                  style={{
                    marginTop: 10,
                    background: "none",
                    border: "none",
                    padding: 0,
                    color: C.muted,
                    fontSize: 13,
                    fontFamily: "inherit",
                    cursor: "pointer",
                    textDecoration: "underline",
                    textUnderlineOffset: 4,
                  }}
                >
                  حاول تاني
                </button>
              </div>
            )}

            {kind === "cancelled" && (
              <div
                style={{
                  marginTop: 24,
                  color: C.muted,
                  fontSize: 14,
                  lineHeight: 1.6,
                }}
              >
                اتلغى التحليل.{" "}
                <button
                  type="button"
                  onClick={reset}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    color: C.text,
                    fontSize: 14,
                    fontFamily: "inherit",
                    cursor: "pointer",
                    textDecoration: "underline",
                    textUnderlineOffset: 4,
                  }}
                >
                  ابدأ من جديد
                </button>
              </div>
            )}
          </>
        )}

        {kind === "analyzing" && (
          <div style={{ paddingTop: 8 }}>
            <div
              style={{
                fontSize: 14,
                color: C.muted,
                marginBottom: 12,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>
                {state.total > 0 ? "بيتم التحليل..." : "بيتم التحضير..."}
              </span>
              {state.total > 0 && (
                <span style={{ fontVariantNumeric: "tabular-nums" }}>
                  {state.done} / {state.total}
                </span>
              )}
            </div>
            <div
              style={{
                height: 2,
                background: C.border,
                borderRadius: 2,
                overflow: "hidden",
                direction: "rtl",
              }}
            >
              <div
                style={{
                  height: "100%",
                  background: C.text,
                  width:
                    state.total > 0
                      ? `${(state.done / state.total) * 100}%`
                      : "0%",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
            <button
              type="button"
              onClick={cancel}
              style={{
                marginTop: 24,
                background: "none",
                border: "none",
                padding: 0,
                color: C.muted,
                fontSize: 13,
                fontFamily: "inherit",
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: 4,
              }}
            >
              إلغاء
            </button>
          </div>
        )}

        {kind === "done" && (
          <div style={{ paddingTop: 8 }}>
            <div
              style={{
                paddingBottom: 24,
                borderBottom: `1px solid ${C.border}`,
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 500,
                  lineHeight: 1.5,
                  color: C.text,
                }}
              >
                {state.headers.white ?? "?"}
                {state.headers.whiteElo ? ` (${state.headers.whiteElo})` : ""}
                <span style={{ color: C.subtle, margin: "0 10px" }}>×</span>
                {state.headers.black ?? "?"}
                {state.headers.blackElo ? ` (${state.headers.blackElo})` : ""}
              </div>
              <div style={{ fontSize: 13, color: C.subtle, marginTop: 6 }}>
                {state.moves.length} نقلة
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <StatsCard moves={state.moves} />
            </div>

            <MoveList moves={state.moves} />

            <div style={{ marginTop: 40 }}>
              <button
                type="button"
                onClick={reset}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  color: C.muted,
                  fontSize: 14,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  textDecoration: "underline",
                  textUnderlineOffset: 4,
                }}
              >
                ارفع مباراة تانية
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
