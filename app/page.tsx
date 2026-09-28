"use client";

import { useState, useEffect, useCallback } from "react";
import { Chessboard } from "@mdwebb/react-chess";
import "@mdwebb/react-chess/styles";

type Opening = { eco: string; name: string };

async function fetchEval(fen: string, depth = 10): Promise<number> {
  try {
    const r = await fetch("/api/eval", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fen, depth }),
    });
    if (!r.ok) return 0;
    const data = await r.json();
    if (data.score?.type === "mate") {
      return data.score.value > 0 ? 10000 : -10000;
    }
    return data.score?.value || 0;
  } catch {
    return 0;
  }
}

export default function Home() {
  const [opening, setOpening] = useState<Opening | null>(null);
  const [openings, setOpenings] = useState<Record<string, Opening> | null>(null);
  const [lastFen, setLastFen] = useState<string>("");
  const [evalCp, setEvalCp] = useState<number>(0);
  const [engineReady, setEngineReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/openings.json")
      .then((r) => r.json())
      .then((data) => setOpenings(data))
      .catch((e) => console.error("Failed to load openings:", e));
  }, []);

  useEffect(() => {
    fetchEval("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", 10)
      .then(() => setEngineReady(true))
      .catch(() => setEngineReady(false));
  }, []);

  const handlePositionChange = useCallback((fen: string) => {
    setLastFen(fen);
  }, []);

  useEffect(() => {
    if (!openings || !lastFen) return;
    const parts = lastFen.split(" ");
    const key = parts.slice(0, 4).join(" ");
    setOpening(openings[key] || null);
  }, [openings, lastFen]);

  useEffect(() => {
    if (!engineReady || !lastFen) return;
    setLoading(true);
    fetchEval(lastFen, 10).then((cp) => {
      setEvalCp(cp);
      setLoading(false);
    });
  }, [engineReady, lastFen]);

  const clampedCp = Math.max(-1000, Math.min(1000, evalCp));
  const whitePct = 50 + clampedCp / 20;

  return (
    <main style={{ padding: "30px", minHeight: "100vh", background: "#161512" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
        <img src="/logo.svg" alt="Outplay" width="36" height="36" />
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#e0e0e0", letterSpacing: "1px", margin: 0 }}>
          OUTPLAY
        </h1>
      </div>

      <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
        <div
          style={{
            width: "24px",
            height: "524px",
            background: "#262421",
            borderRadius: "4px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            border: "1px solid #3d3a37",
          }}
        >
          <div style={{ height: `${whitePct}%`, background: "#e8e8e8", transition: "height 0.5s ease" }} />
          <div style={{ flex: 1, background: "#2a2a2a" }} />
        </div>

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
          <div style={{ fontSize: "11px", color: "#7d7a76", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
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

          <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #3d3a37" }}>
            <div style={{ fontSize: "11px", color: "#7d7a76", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              التقييم
            </div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "#e0e0e0", fontFamily: "monospace" }}>
              {!engineReady
                ? "..."
                : loading
                ? "..."
                : evalCp === 0
                ? "0.0"
                : (evalCp > 0 ? "+" : "") + (evalCp / 100).toFixed(1)}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
