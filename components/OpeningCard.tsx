// components/OpeningCard.tsx
"use client";

import type { Opening } from "@/lib/types";

type OpeningCardProps = {
  /** The matched opening, or null if the position is not in the book yet. */
  opening: Opening | null;
  /** True while the opening book is still loading. */
  bookLoading: boolean;
};

/**
 * Card showing the current opening name and ECO code, plus the latest
 * Stockfish evaluation.
 */
export function OpeningCard({ opening, bookLoading }: OpeningCardProps) {
  return (
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
        }}
      >
        الافتتاحية
      </div>

      {opening ? (
        <>
          <div
            style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "#e0e0e0",
              marginBottom: "6px",
            }}
          >
            {opening.name}
          </div>
          <div
            style={{
              fontSize: "13px",
              color: "#3692e7",
              fontFamily: "monospace",
            }}
          >
            {opening.eco}
          </div>
        </>
      ) : (
        <div style={{ fontSize: "13px", color: "#7d7a76" }}>
          {bookLoading ? "جاري التحميل..." : "العب نقلة..."}
        </div>
      )}
    </div>
  );
}
