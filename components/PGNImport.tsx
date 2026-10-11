// components/PGNImport.tsx
"use client";

import { useRef } from "react";
import Link from "next/link";
import { usePgnImport } from "@/hooks/usePgnImport";
import { MoveList } from "./MoveList";
import { StatsCard } from "./StatsCard";

export function PGNImport() {
  const { state, text, setText, analyze, cancel, reset, loadFile } =
    usePgnImport();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const kind = state.kind;
  const showInput =
    kind === "idle" || kind === "error" || kind === "cancelled";

  return (
    <div dir="rtl" className="import-page">
      <nav className="import-nav">
        <Link href="/" className="import-brand">
          <img src="/logo/rook.svg" alt="" width={32} height={32} />
          <span className="serif">Outplay</span>
        </Link>
        <Link href="/play" className="import-nav-link arabic">
          الرقعة
        </Link>
      </nav>

      <main className="import-main">
        <div className="import-header">
          <div className="section-eyebrow arabic">تحليل</div>
          <h1 className="section-title arabic">حلل مباراتك</h1>
          <p className="import-subtitle arabic">
            الصق PGN من Chess.com أو Lichess، أو ارفع ملف.
          </p>
        </div>

        {showInput && (
          <>
            <div className="import-input-wrap">
              <textarea
                dir="ltr"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder='[Event "..."] 1. e4 e5 2. Nf3 ...'
                spellCheck={false}
                className="import-textarea"
              />

              <div className="import-actions">
                <button
                  type="button"
                  onClick={analyze}
                  disabled={text.trim().length === 0}
                  className="btn-primary arabic"
                >
                  حلل
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </button>

                <label className="import-file-label arabic">
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
                <div className="import-error">
                  <p className="import-error-msg arabic">{state.message}</p>
                  <button
                    type="button"
                    onClick={reset}
                    className="import-link arabic"
                  >
                    حاول تاني
                  </button>
                </div>
              )}

              {kind === "cancelled" && (
                <div className="import-cancelled arabic">
                  اتلغى التحليل.{" "}
                  <button
                    type="button"
                    onClick={reset}
                    className="import-link"
                  >
                    ابدأ من جديد
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {kind === "analyzing" && (
          <div className="import-progress-wrap">
            <div className="import-progress-header arabic">
              <span>
                {state.total > 0 ? "بيتم التحليل..." : "بيتم التحضير..."}
              </span>
              {state.total > 0 && (
                <span className="import-progress-count">
                  {state.done} / {state.total}
                </span>
              )}
            </div>
            <div className="import-progress-bar">
              <div
                className="import-progress-fill"
                style={{
                  width:
                    state.total > 0
                      ? `${(state.done / state.total) * 100}%`
                      : "0%",
                }}
              />
            </div>
            <button
              type="button"
              onClick={cancel}
              className="import-link arabic"
            >
              إلغاء
            </button>
          </div>
        )}

        {kind === "done" && (
          <div className="import-results">
            <div className="import-game-header">
              <div className="import-players arabic">
                {state.headers.white ?? "?"}
                {state.headers.whiteElo ? ` (${state.headers.whiteElo})` : ""}
                <span className="import-vs">×</span>
                {state.headers.black ?? "?"}
                {state.headers.blackElo ? ` (${state.headers.blackElo})` : ""}
              </div>
              <div className="import-moves-count arabic">
                {state.moves.length} نقلة
              </div>
            </div>

            <div className="import-stats">
              <StatsCard moves={state.moves} />
            </div>

            <MoveList moves={state.moves} />

            <div className="import-reset-wrap">
              <button
                type="button"
                onClick={reset}
                className="import-link arabic"
              >
                ارفع مباراة تانية
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
