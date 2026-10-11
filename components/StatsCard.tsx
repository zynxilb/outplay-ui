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
  Best: { symbol: "\u2605", color: "#81B64C", label: "أفضل" },
  Excellent: { symbol: "\uD83D\uDC4D", color: "#96BC4B", label: "ممتاز" },
  Good: { symbol: "\u2713", color: "#96BC4B", label: "جيد" },
  Book: { symbol: "\uD83D\uDCD6", color: "#A88865", label: "كتاب" },
  Inaccuracy: { symbol: "?!", color: "#F7C045", label: "غير دقيق" },
  Mistake: { symbol: "?", color: "#E58F2A", label: "خطأ" },
  Miss: { symbol: "\u2717", color: "#CA3431", label: "أضاع فرصة" },
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
      <div className="stats-card">
        <div className="stats-empty arabic">مفيش إحصائيات بعد.</div>
      </div>
    );
  }

  return (
    <div className="stats-card">
      {/* Accuracy hero */}
      <div className="stats-accuracy">
        <div className="stats-accuracy-side">
          <div className="stats-accuracy-label arabic">أبيض</div>
          <div className="stats-accuracy-value">{stats.white.accuracy}%</div>
        </div>
        <div className="stats-accuracy-divider" />
        <div className="stats-accuracy-side">
          <div className="stats-accuracy-label arabic">أسود</div>
          <div className="stats-accuracy-value">{stats.black.accuracy}%</div>
        </div>
      </div>

      {/* Classifications */}
      <div className="stats-rows">
        {ORDER.map((key) => {
          const style = STYLES[key];
          const w = stats.white.counts[key];
          const b = stats.black.counts[key];
          const bothZero = w === 0 && b === 0;
          return (
            <div
              key={key}
              className={`stats-row${bothZero ? " stats-row-dim" : ""}`}
            >
              <div className="stats-row-label">
                <span
                  className="stats-row-symbol"
                  style={{ color: style.color }}
                >
                  {style.symbol}
                </span>
                <span className="stats-row-text arabic">{style.label}</span>
              </div>
              <div className="stats-row-count">{w}</div>
              <div className="stats-row-mid">&middot;</div>
              <div className="stats-row-count">{b}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
