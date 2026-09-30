// app/page.tsx
"use client";

import { useState, useCallback } from "react";
import { useChessGame, unpackMove } from "gigaboard";
import type { PackedMove } from "gigaboard";
import { Chess } from "chess.js";

import { Board } from "@/components/Board";
import { EvalBar } from "@/components/EvalBar";
import { OpeningCard } from "@/components/OpeningCard";

import { useOpeningBook } from "@/hooks/useOpeningBook";
import { useStockfishEval } from "@/hooks/useStockfishEval";

import { squareIndexToAlgebraic } from "@/lib/chess-helpers";
import { PROMOTION_PIECES } from "@/lib/types";
import type { MoveOptions } from "@/lib/types";

export default function Home() {
  const game = useChessGame();
  const [chess] = useState(() => new Chess());
  const [fen, setFen] = useState(() => new Chess().fen());

  const { book, opening } = useOpeningBook(fen);
  const { evalCp } = useStockfishEval(fen);

  const handleMove = useCallback(
    (move: PackedMove) => {
      const { from, to, promo } = unpackMove(move);
      const options: MoveOptions = {
        from: squareIndexToAlgebraic(from),
        to: squareIndexToAlgebraic(to),
      };
      if (promo > 0) {
        options.promotion = PROMOTION_PIECES[promo];
      }
      try {
        const result = chess.move(options);
        if (result) setFen(chess.fen());
      } catch {
        // Illegal move — ignore. The board will keep its current position.
      }
    },
    [chess]
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
        <Board game={game} onMove={handleMove} />
        <OpeningCard opening={opening} bookLoading={book === null} />
      </div>
    </main>
  );
}
