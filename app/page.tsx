"use client";

import { Chessboard } from "@mdwebb/react-chess";
import "@mdwebb/react-chess/styles";

export default function Home() {
  return (
    <main
      style={{
        padding: "40px",
        minHeight: "100vh",
        background: "#161512",
      }}
    >
      <h1
        style={{
          fontSize: "32px",
          fontWeight: 700,
          marginBottom: "20px",
          color: "#e0e0e0",
        }}
      >
        ♟️ Outplay
      </h1>

      <div
        style={{
          background: "#262421",
          padding: "16px",
          borderRadius: "4px",
          width: "fit-content",
        }}
      >
        <Chessboard
          width={500}
          height={500}
          theme="brown"
          showBoardControls
        />
      </div>
    </main>
  );
}
