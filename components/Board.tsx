// components/Board.tsx
"use client";

import { Chessboard } from "gigaboard";
import type { BoardModel, PackedMove } from "gigaboard";
import { brown } from "gigaboard/themes";
import { cburnett } from "gigaboard/pieces";

type BoardProps = {
  /** The board model created by useChessGame(). */
  game: BoardModel;
  /** Called after every successful move. */
  onMove: (move: PackedMove) => void;
};

/**
 * Chessboard wrapper.
 *
 * Important: the wrapper is forced to LTR direction. The app is RTL for
 * Arabic, but the board's pointer-coordinate math depends on LTR, otherwise
 * touch events report mirrored squares and pieces fly to the wrong target.
 */
export function Board({ game, onMove }: BoardProps) {
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
