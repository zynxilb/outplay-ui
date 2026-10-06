// components/Board.tsx
"use client";

import { useEffect } from "react";
import { Chessboard } from "gigaboard";
import type { BoardModel, PackedMove } from "gigaboard";
import { brown } from "gigaboard/themes";
import { cburnett } from "gigaboard/pieces";
import { algebraicToSquareIndex } from "@/lib/chess-helpers";
import type { MotifArrow } from "@/lib/types";

type BoardProps = {
  game: BoardModel;
  onMove: (move: PackedMove) => void;
  bestMove?: string | null;
  motifArrows?: MotifArrow[];
  viewOnly?: boolean;
};

export function Board({ game, onMove, bestMove, motifArrows, viewOnly = false }: BoardProps) {
  // Best-move arrow + motif arrows — all managed by the app.
  useEffect(() => {
    game.clearManagedArrows();

    // Best-move arrow (green).
    if (bestMove && bestMove.length >= 4) {
      try {
        const from = algebraicToSquareIndex(bestMove.slice(0, 2));
        const to = algebraicToSquareIndex(bestMove.slice(2, 4));
        game.addArrow({
          from: from as never,
          to: to as never,
          color: "#81B64C",
          managed: true,
        });
      } catch {
        // ignore
      }
    }

    // Motif arrows (fork/pin/skewer/discovered).
    if (motifArrows) {
      for (const a of motifArrows) {
        try {
          const from = algebraicToSquareIndex(a.from);
          const to = algebraicToSquareIndex(a.to);
          game.addArrow({
            from: from as never,
            to: to as never,
            color: a.color,
            managed: true,
          });
        } catch {
          // ignore
        }
      }
    }
  }, [game, bestMove, motifArrows]);

  return (
    <div
      style={{
        background: "#262421",
        padding: "12px",
        borderRadius: "4px",
        width: "fit-content",
      }}
    >
      <div
        dir="ltr"
        className="board-wrapper"
        style={{
          width: "500px",
          height: "500px",
          direction: "ltr",
        }}
      >
        <Chessboard
          game={game}
          onMove={onMove}
          viewOnly={viewOnly}
          theme={brown}
          pieces={cburnett}
          orientation="white"
          showCoordinates={true}
          animation={{ durationMs: 0 }}
        />
      </div>
    </div>
  );
}
