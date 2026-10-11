// components/PGNImport.tsx
"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePgnImport } from "@/hooks/usePgnImport";
import { MoveList } from "./MoveList";
import { StatsCard } from "./StatsCard";

const EXAMPLE_PGN = `[Event "Casual"]
[White "Player"]
[Black "Opponent"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7 1-0`;

export function PGNImport() {
  const { state, text, setText, analyze, cancel, reset, loadFile } =
    usePgnImport();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [pasteError, setPasteError] = useState<string | null>(null);

  const kind = state.kind;
  const showInput =
    kind === "idle" || kind === "error" || kind === "cancelled";

  const handlePaste = async () => {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) {
        setText(clip);
        setPasteError(null);
      }
    } catch {
      setPasteError("مش قادر أقرا الحافظة. الصق يدويًا.");
    }
  };

  const handleExample = () => {
    setText(EXAMPLE_PGN);
    setPasteError(null);
  };

  const lineCount = text.split("\n").filter((l) => l.trim()).length;

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
          <div className="import-input-card">
            <div className="import-input-header">
              <div className="import-input-label arabic">PGN</div>
              <div className="import-input-actions-mini">
                <button
                  type="button"
                  onClick={handlePaste}
                  className="import-chip arabic"
                >
                  الصق من الحافظة
                </button>
                <button
                  type="button"
                  onClick={handleExample}
                  className="import-chip arabic"
                >
                  مثال
                </button>
              </div>
            </div>

            <textarea
              dir="ltr"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={'[Event "..."] 1. e4 e5 2. Nf3 ...'}
              spellCheck={false}
              className="import-textarea"
            />

            <div className="import-input-footer">
              <div className="import-input-meta arabic">
                {text.length > 0 ? (
                  <>
                    <span>{text.length} حرف</span>
                    {lineCount > 0 && <span>· {lineCount} سطر</span>}
                  </>
                ) : (
                  <span className="import-input-hint arabic">
                    جاهز للصق
                  </span>
                )}
              </div>

              <div className="import-actions">
                <label className="import-file-label arabic">
                  ارفع ملف
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pgn,.txt"
                    style={{ display: "none" }}
                    onChange={(e) => loadFile(e.target.files?.[0] ?? null)}
                  />
                </label>

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
              </div>
            </div>

            {pasteError && (
              <div className="import-error arabic" style={{ marginTop: 16 }}>
                {pasteError}
              </div>
            )}

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
                <button type="button" onClick={reset} className="import-link">
                  ابدأ من جديد
                </button>
              </div>
            )}
          </div>
        )}

        {kind === "analyzing" && (
          <div className="import-loading">
            <div className="import-loading-rook">
              <img src="/logo/rook.svg" alt="" width={72} height={72} />
            </div>
            <div className="import-loading-title arabic">
              {state.total > 0 ? "بيتم التحليل..." : "بيتم التحضير..."}
            </div>
            {state.total > 0 && (
              <div className="import-loading-count">
                {state.done} / {state.total}
              </div>
            )}

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
