// components/StatsCard.tsx
"use client";

import { useMemo } from "react";
import type { ClassifiedMove } from "@/lib/types";
import type { MoveClassification } from "@/lib/chess-helpers";

type StatsCardProps = {
  moves: ClassifiedMove[];
};

type SideStats = {
  accuracy: number;
  counts: Record<MoveClassification, number>;
  totalMoves: number;
};

const ORDER: MoveClassification[] = [
  "Brilliant",
  "Great",
  "Best",
  "Excellent",
  "Good",
  "Book",
  "Inaccuracy",
  "Mistake",
  "Miss",
  "Blunder",
];

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

function winPercent(cp: number): number {
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);
}

function moveAccuracy(
  evalBeforeCp: number,
  evalAfterCp: number,
  moverColor: "w" | "b"
): number {
  const before = moverColor === "w" ? evalBeforeCp : -evalBeforeCp;
  const after = moverColor === "w" ? evalAfterCp : -evalAfterCp;
  const wpLoss = Math.max(0, winPercent(before) - winPercent(after));
  if (wpLoss <= 0) return 100;
  const acc = 103.1668 * Math.exp(-0.04354 * wpLoss) - 3.1669;
  return Math.max(0, Math.min(100, acc));
}

function emptyCounts(): Record<MoveClassification, number> {
  return {
    Brilliant: 0,
    Great: 0,
    Best: 0,
    Excellent: 0,
    Good: 0,
    Book: 0,
    Inaccuracy: 0,
    Mistake: 0,
    Miss: 0,
    Blunder: 0,
  };
}

function computeSideStats(moves: ClassifiedMove[], isWhite: boolean): SideStats {
  const sideMoves = moves.filter((m) => (m.color === "w") === isWhite);
  const counts = emptyCounts();

  let accSum = 0;
  let accCount = 0;

  for (const m of sideMoves) {
    counts[m.classification] += 1;
    if (m.classification === "Book") continue;
    accSum += moveAccuracy(m.evalBefore, m.evalAfter, m.color);
    accCount += 1;
  }

  const accuracy = accCount > 0 ? Math.round(accSum / accCount) : 0;

  return {
    accuracy,
    counts,
    totalMoves: sideMoves.length,
  };
}

const ROW_STYLE: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 60px 40px 60px",
  alignItems: "center",
  padding: "6px 12px",
  fontSize: "13px",
  borderBottom: "1px solid #3C3A38",
};

export function StatsCard({ moves }: StatsCardProps) {
  const stats = useMemo(
    () => ({
      white: computeSideStats(moves, true),
      black: computeSideStats(moves, false),
    }),
    [moves]
  );

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
        إحصائيات اللعبة — ابدأ اللعب.
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
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 60px 40px 60px",
          padding: "10px 12px",
          borderBottom: "1px solid #3C3A38",
          fontSize: "11px",
          color: "#C3C2C1",
          textTransform: "uppercase",
          fontWeight: 600,
        }}
      >
        <div>التصنيف</div>
        <div style={{ textAlign: "center" }}>أبيض</div>
        <div style={{ textAlign: "center" }}>—</div>
        <div style={{ textAlign: "center" }}>أسود</div>
      </div>

      {/* Rows */}
      {ORDER.map((key) => {
        const style = STYLES[key];
        const w = stats.white.counts[key];
        const b = stats.black.counts[key];
        return (
          <div key={key} style={ROW_STYLE}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#C3C2C1",
              }}
            >
              <span style={{ color: style.color, fontWeight: 700, width: "20px" }}>
                {style.symbol}
              </span>
              <span style={{ fontSize: "12px" }}>{style.label}</span>
            </div>
            <div
              style={{
                textAlign: "center",
                color: w > 0 ? "#FFFFFF" : "#5a5651",
                fontWeight: 700,
                fontFamily: "ui-monospace, monospace",
              }}
            >
              {w}
            </div>
            <div style={{ textAlign: "center", color: "#5a5651" }}>·</div>
            <div
              style={{
                textAlign: "center",
                color: b > 0 ? "#FFFFFF" : "#5a5651",
                fontWeight: 700,
                fontFamily: "ui-monospace, monospace",
              }}
            >
              {b}
            </div>
          </div>
        );
      })}

      {/* Accuracy + Game Rating footer */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 60px 40px 60px",
          padding: "12px",
          background: "#262421",
          fontSize: "13px",
          borderTop: "1px solid #3C3A38",
        }}
      >
        <div style={{ color: "#C3C2C1", fontWeight: 700 }}>الدقة</div>
        <div
          style={{
            textAlign: "center",
            color: "#3692e7",
            fontWeight: 800,
            fontFamily: "ui-monospace, monospace",
            fontSize: "16px",
          }}
        >
          {stats.white.accuracy}%
        </div>
        <div />
        <div
          style={{
            textAlign: "center",
            color: "#3692e7",
            fontWeight: 800,
            fontFamily: "ui-monospace, monospace",
            fontSize: "16px",
          }}
        >
          {stats.black.accuracy}%
        </div>
      </div>
    </div>
  );
}
