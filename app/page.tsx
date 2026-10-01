// app/page.tsx
"use client";

import { useState, useCallback } from "react";
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

  const { moves, recordMove } = useMoveHistory({
    fen,
    evaluatedFen,
    engineReady,
    cacheVersion,
    openingBook: book,
    getEvalForFen,
  });

  const handleMove = useCallback(
    (packedMove: PackedMove) => {
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
    [chess, recordMove]
  );

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
        <EvalBar evalCp={evalCp} height={500} />
        <Board game={game} onMove={handleMove} bestMove={bestMove} />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <OpeningCard opening={opening} bookLoading={book === null} />
          <StatsCard moves={moves} />
          <MoveList moves={moves} />
        </div>
      </div>
    </main>
  );
}
