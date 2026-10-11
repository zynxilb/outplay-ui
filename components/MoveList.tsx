// components/MoveList.tsx
"use client";

import type { ClassifiedMove } from "@/lib/types";
import type { MoveClassification } from "@/lib/chess-helpers";

type MoveListProps = {
  moves: ClassifiedMove[];
  selectedPly?: number | null;
  onSelect?: (ply: number) => void;
};

const STYLES: Record<
  MoveClassification,
  { symbol: string; color: string; label: string }
> = {
  Brilliant: { symbol: "!!", color: "#1BACA6", label: "عبقرية" },
  Great: { symbol: "!", color: "#5C8BB0", label: "عظيمة" },
  Best: { symbol: "\u2605", color: "#81B64C", label: "أفضل" },
  Excellent: { symbol: "\u25B2", color: "#96BC4B", label: "ممتاز" },
  Good: { symbol: "\u25CF", color: "#96BC4B", label: "جيد" },
  Book: { symbol: "\u25C6", color: "#A88865", label: "كتاب" },
  Inaccuracy: { symbol: "?!", color: "#F7C045", label: "غير دقيق" },
  Mistake: { symbol: "?", color: "#E58F2A", label: "خطأ" },
  Miss: { symbol: "\u2717", color: "#CA3431", label: "أضاع فرصة" },
  Blunder: { symbol: "??", color: "#B33430", label: "كارثة" },
};

const MOTIF_LABELS: Record<string, string> = {
  fork: "شوكة",
  pin: "ضغط",
  skewer: "سكيوير",
  discovered: "كشف",
};

export function MoveList({ moves, selectedPly, onSelect }: MoveListProps) {
  if (moves.length === 0) {
    return (
      <div className="move-list">
        <div className="move-list-empty arabic">مفيش نقلات بعد.</div>
      </div>
    );
  }

  return (
    <div className="move-list">
      {moves.map((move) => {
        const style = STYLES[move.classification];
        const isWhite = move.color === "w";
        const moveNumber = Math.ceil(move.ply / 2);
        const isSelected = selectedPly === move.ply;
        const clickable = !!onSelect;

        return (
          <button
            key={move.ply}
            type="button"
            onClick={onSelect ? () => onSelect(move.ply) : undefined}
            className={`move-row${isSelected ? " move-row-selected" : ""}${
              clickable ? " move-row-clickable" : ""
            }`}
          >
            <span className="move-row-num">
              {isWhite ? `${moveNumber}.` : ""}
            </span>
            <span className="move-row-san" dir="ltr">
              {move.san}
            </span>
            {move.motifs && move.motifs.length > 0 && (
              <span className="move-row-motifs arabic">
                {move.motifs.map((m) => MOTIF_LABELS[m] ?? m).join(" \u00B7 ")}
              </span>
            )}
            <span
              className="move-row-symbol"
              style={{ color: style.color }}
              aria-label={style.label}
              title={style.label}
            >
              {style.symbol}
            </span>
          </button>
        );
      })}
    </div>
  );
}
