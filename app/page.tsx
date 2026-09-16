"use client";

import dynamic from "next/dynamic";

const NextChessground = dynamic(() => import("next-chessground"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: "500px",
        height: "500px",
        background: "#3d3a37",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#7d7a76",
      }}
    >
      جاري التحميل...
    </div>
  ),
});

export default function Home() {
  return (
    <main style={{ padding: "40px", minHeight: "100vh", background: "#161512" }}>
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

      <div style={{ display: "flex", gap: "30px", flexWrap: "wrap" }}>
        <div
          style={{
            background: "#262421",
            padding: "16px",
            borderRadius: "4px",
            width: "500px",
            maxWidth: "100%",
          }}
        >
          <NextChessground />
        </div>
      </div>
    </main>
  );
}
