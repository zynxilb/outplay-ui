// components/EvalBar.tsx
"use client";

type EvalBarProps = {
  evalCp: number;
  height?: number;
};

export function EvalBar({ evalCp, height = 500 }: EvalBarProps) {
  const clampedCp = Math.max(-1000, Math.min(1000, evalCp));
  const whitePercent = 50 + clampedCp / 20;

  return (
    <div
      style={{
        width: "24px",
        height: `${height}px`,
        background: "#262421",
        borderRadius: "4px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        border: "1px solid #3d3a37",
      }}
    >
      {/* الأسود في الأعلى */}
      <div style={{ flex: 1, background: "#2a2a2a" }} />
      {/* الأبيض في الأسفل */}
      <div
        style={{
          height: `${whitePercent}%`,
          background: "#e8e8e8",
          transition: "height 0.5s ease",
        }}
      />
    </div>
  );
}
