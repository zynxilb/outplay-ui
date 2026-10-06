// app/play/page.tsx
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useChessGame, unpackMove } from "gigaboard";
import type { PackedMove } from "gigaboard";
import { Chess } from "chess.js";

import { Board } from "@/components/Board";
import { EvalBar } from "@/components/EvalBar";
import { OpeningCard } from "@/components/OpeningCard";
import { MoveList } from "@/components/MoveList";
import { StatsCard } from "@/components/StatsCard";

import { useOpeningBook } from "@/hooks/useOpeningBook";
import { useStockfishEval } from "@/hooks/useStockfishEval";
import { useMoveHistory } from "@/hooks/useMoveHistory";

import { squareIndexToAlgebraic } from "@/lib/chess-helpers";
import { isSacrifice } from "@/lib/sacrifice-detector";
import { PROMOTION_PIECES } from "@/lib/types";
import type { MoveOptions } from "@/lib/types";
import { resolveViewPly } from "@/lib/view-ply";
import { nextBoardAction } from "@/lib/next-board-action";

export default function Home() {
  const game = useChessGame();
  const [chess] = useState(() => new Chess());
  const [fen, setFen] = useState(() => new Chess().fen());

  const { book, opening } = useOpeningBook(fen);
  const {
    evalCp,
    bestMove,
    evaluatedFen,
    engineReady,
    cacheVersion,
    getEvalForFen,
  } = useStockfishEval(fen);

  const [selectedPly, setSelectedPly] = useState<number | null>(null);
  const [dbg, setDbg] = useState<string[]>([]);
  const dlog = (s: string) => setDbg((p) => [...p.slice(-9), s]);

  const { moves, recordMove } = useMoveHistory({
    fen,
    evaluatedFen,
    engineReady,
    cacheVersion,
    openingBook: book,
    getEvalForFen,
  });

  const viewPly = resolveViewPly(selectedPly, moves.length);
  const isPreview = viewPly !== null;

  const handleMove = useCallback(
    (packedMove: PackedMove) => {
      dlog(`hM ENTER isP=${isPreview} sP=${selectedPly}`);
      if (isPreview) return;
      setSelectedPly(null);
      const { from, to, promo } = unpackMove(packedMove);
      const options: MoveOptions = {
        from: squareIndexToAlgebraic(from),
        to: squareIndexToAlgebraic(to),
      };
      if (promo > 0) {
        options.promotion = PROMOTION_PIECES[promo];
      }
      try {
        const fenBefore = chess.fen();
        const result = chess.move(options);
        if (!result) return;
        const fenAfter = chess.fen();

        const moveUci =
          result.from + result.to + (result.promotion ?? "");
        const sacrifice = isSacrifice(fenBefore, moveUci);

        recordMove(result, fenBefore, fenAfter, sacrifice);
        setFen(fenAfter);
      } catch {
        // Illegal move — ignore.
      }
    },
    [chess, recordMove, isPreview]
  );

  // Preview mode: track the transition so we can restore the live ply on exit.
  const prevViewPlyRef = useRef<number | null>(null);
  const liveHistoryPlyRef = useRef<number | null>(null);

  useEffect(() => {
    const snap = game.getSnapshot();
    dlog(`eff prevVP=${prevViewPlyRef.current} vP=${viewPly} sP=${selectedPly} mL=${moves.length} hP=${snap.historyPly} hL=${snap.historyLength}`);
    const wasPreview = prevViewPlyRef.current !== null;
    const enteringPreview = viewPly !== null && !wasPreview;

    if (enteringPreview) {
      liveHistoryPlyRef.current = game.getSnapshot().historyPly;
    }

    const action = nextBoardAction(
      prevViewPlyRef.current,
      viewPly,
      liveHistoryPlyRef.current,
      game.getSnapshot().historyLength
    );

    if (action) {
      dlog(`GOTO ${action.goto}`);
      game.goto(action.goto);
    }

    if (viewPly === null && wasPreview) {
      liveHistoryPlyRef.current = null;
    }

    prevViewPlyRef.current = viewPly;
  }, [viewPly, game]);

  const selectedMove =
    selectedPly !== null
      ? moves.find((m) => m.ply === selectedPly) ?? null
      : null;
  const motifArrows = selectedMove?.motifArrows ?? [];
  const activeBestMove = isPreview ? null : bestMove;
  const displayEvalCp = selectedMove?.evalAfter ?? evalCp;

  return (
    <main
      style={{
        padding: "30px",
        minHeight: "100vh",
        background: "#161512",
      }}
    >
      <h1
        style={{
          fontSize: "22px",
          fontWeight: 700,
          color: "#e0e0e0",
          letterSpacing: "1px",
          marginBottom: "20px",
        }}
      >
        OUTPLAY
      </h1>

      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        <EvalBar evalCp={displayEvalCp} height={500} />
        <Board
          game={game}
          onMove={handleMove}
          bestMove={activeBestMove}
          motifArrows={motifArrows}
          viewOnly={isPreview}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <OpeningCard opening={opening} bookLoading={book === null} />
          <StatsCard moves={moves} />
          <MoveList
          moves={moves}
          selectedPly={selectedPly}
          onSelect={setSelectedPly}
        />
        </div>
      </div>
      <div
        style={{
          position: "fixed",
          top: "60px",
          left: "4px",
          background: "rgba(0,0,0,0.92)",
          color: "#0f0",
          padding: "4px 6px",
          fontSize: "9px",
          fontFamily: "monospace",
          zIndex: 9999,
          whiteSpace: "pre-wrap",
          lineHeight: 1.3,
          direction: "ltr",
          textAlign: "left",
          pointerEvents: "none",
          maxWidth: "180px",
          borderRadius: "3px",
        }}
      >
        {dbg.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </main>
  );
}
