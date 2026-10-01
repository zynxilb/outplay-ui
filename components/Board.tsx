// components/Board.tsx
"use client";

import { useEffect } from "react";
import { Chessboard } from "gigaboard";
import type { BoardModel, PackedMove } from "gigaboard";
import { brown } from "gigaboard/themes";
import { cburnett } from "gigaboard/pieces";
import { algebraicToSquareIndex } from "@/lib/chess-helpers";

type BoardProps = {
  /** The board model created by useChessGame(). */
  game: BoardModel;
  /** Called after every successful move. */
  onMove: (move: PackedMove) => void;
  /** Engine's best move in UCI (e.g. "e2e4"), or null. */
  bestMove?: string | null;
};

/**
 * Chessboard wrapper.
 *
 * Important: the wrapper is forced to LTR direction. The app is RTL for
 * Arabic, but the board's pointer-coordinate math depends on LTR, otherwise
 * touch events report mirrored squares and pieces fly to the wrong target.
 */
export function Board({ game, onMove, bestMove }: BoardProps) {
  // Best-move arrow (managed by the app).
  useEffect(() => {
    game.clearManagedArrows();
    if (!bestMove || bestMove.length < 4) return;
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
      // ignore malformed uci
    }
  }, [game, bestMove]);

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
