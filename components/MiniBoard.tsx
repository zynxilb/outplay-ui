// components/MiniBoard.tsx
"use client";

// Lightweight SVG chess board for showing a single FEN.
// No dependencies — parses FEN and renders Unicode pieces.

const PIECE_GLYPHS: Record<string, string> = {
  k: "\u265A",
  q: "\u265B",
  r: "\u265C",
  b: "\u265D",
  n: "\u265E",
  p: "\u265F",
  K: "\u265A",
  Q: "\u265B",
  R: "\u265C",
  B: "\u265D",
  N: "\u265E",
  P: "\u265F",
};

const LIGHT = "#E8D9B5";
const DARK = "#8B6F47";

type Cell = string | null;

function parseFenBoard(fen: string): Cell[][] {
  const rows: Cell[][] = [];
  const position = fen.split(" ")[0] ?? "";
  const ranks = position.split("/");
  for (let r = 0; r < 8; r++) {
    const rank = ranks[r] ?? "8";
    const row: Cell[] = [];
    for (const ch of rank) {
      if (/[1-8]/.test(ch)) {
        const n = parseInt(ch, 10);
        for (let i = 0; i < n; i++) row.push(null);
      } else {
        row.push(ch);
      }
    }
    while (row.length < 8) row.push(null);
    rows.push(row.slice(0, 8));
  }
  return rows;
}

export function MiniBoard({ fen }: { fen: string }) {
  const board = parseFenBoard(fen);

  return (
    <svg
      viewBox="0 0 800 800"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block", borderRadius: 8, overflow: "hidden" }}
      aria-label="الموقف الحالي"
    >
      {board.map((row, y) =>
        row.map((piece, x) => {
          const isLight = (x + y) % 2 === 0;
          const fill = isLight ? LIGHT : DARK;
          return (
            <g key={`${x}-${y}`}>
              <rect
                x={x * 100}
                y={y * 100}
                width={100}
                height={100}
                fill={fill}
              />
              {piece && (
                <text
                  x={x * 100 + 50}
                  y={y * 100 + 54}
                  fontSize={72}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={piece === piece.toUpperCase() ? "#FAFAFA" : "#1A1A1A"}
                  stroke={piece === piece.toUpperCase() ? "#1A1A1A" : "#FAFAFA"}
                  strokeWidth={1.5}
                  style={{
                    fontFamily:
                      "\'Segoe UI Symbol\', \'Noto Sans Symbols 2\', \'Apple Symbols\', sans-serif",
                    fontWeight: 400,
                    userSelect: "none",
                  }}
                >
                  {PIECE_GLYPHS[piece] ?? ""}
                </text>
              )}
            </g>
          );
        })
      )}
    </svg>
  );
}
