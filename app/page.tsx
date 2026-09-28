"use client";

import { useState, useEffect, useCallback } from "react";
import { Chessboard } from "@mdwebb/react-chess";
import "@mdwebb/react-chess/styles";

type Opening = { eco: string; name: string };

export default function Home() {
  const [opening, setOpening] = useState<Opening | null>(null);
  const [openings, setOpenings] = useState<Record<string, Opening> | null>(null);
  const [lastFen, setLastFen] = useState<string>("");

  useEffect(() => {
    fetch("/openings.json")
      .then((r) => r.json())
      .then((data) => setOpenings(data))
      .catch((e) => console.error("Failed to load openings:", e));
  }, []);

  const handlePositionChange = useCallback(
    (fen: string) => {
      setLastFen(fen);
      if (!openings) return;
      const parts = fen.split(" ");
      const key = parts.slice(0, 4).join(" ");
      setOpening(openings[key] || null);
    },
    [openings]
  );

  useEffect(() => {
    if (!openings || !lastFen) return;
    const parts = lastFen.split(" ");
    const key = parts.slice(0, 4).join(" ");
    setOpening(openings[key] || null);
  }, [openings, lastFen]);

  return (
    <main style={{ padding: "30px", minHeight: "100vh", background: "#161512" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
        <img src="/logo.svg" alt="Outplay" width="36" height="36" />
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#e0e0e0", letterSpacing: "1px", margin: 0 }}>
          OUTPLAY
        </h1>
      </div>

      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ background: "#262421", padding: "12px", borderRadius: "4px", width: "fit-content" }}>
          <Chessboard
            width={500}
            height={500}
            theme="brown"
            showBoardControls
            onPositionChange={handlePositionChange}
          />
        </div>

        <div
          style={{
            background: "#262421",
            padding: "16px 20px",
            borderRadius: "4px",
            border: "1px solid #3d3a37",
            minWidth: "260px",
            height: "fit-content",
          }}
        >
          <div
            style={{
              fontSize: "11px",
              color: "#7d7a76",
              marginBottom: "8px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            الافتتاحية
          </div>
          {opening ? (
            <>
              <div style={{ fontSize: "16px", fontWeight: 600, color: "#e0e0e0", marginBottom: "6px" }}>
                {opening.name}
              </div>
              <div style={{ fontSize: "13px", color: "#3692e7", fontFamily: "monospace" }}>
                {opening.eco}
              </div>
            </>
          ) : (
            <div style={{ fontSize: "13px", color: "#7d7a76" }}>
              {openings ? "العب نقلة..." : "جاري التحميل..."}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
