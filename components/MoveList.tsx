// components/MoveList.tsx
"use client";

import type { ClassifiedMove } from "@/lib/types";
import type { MoveClassification } from "@/lib/chess-helpers";

type MoveListProps = {
  moves: ClassifiedMove[];
};

const STYLES: Record<
  MoveClassification,
  { symbol: string; color: string; label: string }
> = {
  Brilliant: { symbol: "!!", color: "#1BACA6", label: "عبقرية" },
  Great: { symbol: "!", color: "#5C8BB0", label: "عظيمة" },
  Best: { symbol: "★", color: "#81B64C", label: "أفضل" },
  Excellent: { symbol: "👍", color: "#96BC4B", label: "ممتاز" },
  Good: { symbol: "✓", color: "#96BC4B", label: "جيد" },
  Book: { symbol: "📖", color: "#A88865", label: "كتاب" },
  Inaccuracy: { symbol: "?!", color: "#F7C045", label: "غير دقيق" },
  Mistake: { symbol: "?", color: "#E58F2A", label: "خطأ" },
  Miss: { symbol: "✗", color: "#CA3431", label: "أضاع فرصة" },
  Blunder: { symbol: "??", color: "#B33430", label: "كارثة" },
};

export function MoveList({ moves }: MoveListProps) {
  if (moves.length === 0) {
    return (
      <div
        style={{
          background: "#302E2B",
          border: "1px solid #3d3a37",
          borderRadius: "6px",
          padding: "16px 20px",
          minWidth: "280px",
          fontSize: "13px",
          color: "#7d7a76",
        }}
      >
        مفيش نقلات لسه — ابدأ اللعب.
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#302E2B",
        border: "1px solid #3d3a37",
        borderRadius: "6px",
        minWidth: "280px",
        maxHeight: "500px",
        overflowY: "auto",
        fontFamily: "ui-monospace, monospace",
        fontSize: "13px",
      }}
    >
      {moves.map((move) => {
        const style = STYLES[move.classification];
        const isWhite = move.color === "w";
        const moveNumber = Math.ceil(move.ply / 2);

        return (
          <div
            key={move.ply}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "6px 12px",
              borderBottom: "1px solid #3C3A38",
            }}
          >
            <span style={{ color: "#7d7a76", width: "32px" }}>
              {isWhite ? `${moveNumber}.` : ""}
            </span>
            <span
              style={{
                flex: 1,
                color: "#e0e0e0",
                fontWeight: 600,
              }}
            >
              {move.san}
            </span>
            {move.motifs && move.motifs.length > 0 && (
              <span
                style={{
                  color: "#1BACA6",
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "2px 6px",
                  border: "1px solid #1BACA6",
                  borderRadius: "3px",
                  marginRight: "6px",
                }}
              >
                {move.motifs.includes("fork") ? "شوكة" : move.motifs[0]}
              </span>
            )}
            <span
              aria-label={style.label}
              style={{
                color: style.color,
                fontSize: "13px",
                fontWeight: 700,
                minWidth: "24px",
                textAlign: "center",
              }}
            >
              {style.symbol}
            </span>
          </div>
        );
      })}
    </div>
  );
}
