// components/MiniBoard.tsx
"use client";

import { Chessboard, useChessGame } from "gigaboard";
import { brown } from "gigaboard/themes";

export function MiniBoard({ fen }: { fen: string }) {
  const model = useChessGame();

  return (
    <div className="mini-board-wrapper">
      <Chessboard
        game={model}
        positionFen={fen}
        fallbackFen={fen}
        viewOnly
        theme={brown}
        orientation="white"
        showCoordinates={false}
        sound={false}
        haptics={false}
      />
    </div>
  );
}
