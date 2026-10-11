import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Outplay — Arabic Chess Analysis";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0D0E11",
        }}
      >
        <div
          style={{
            fontSize: 140,
            fontWeight: 700,
            color: "#EEEEEE",
            fontFamily: "Georgia, serif",
            letterSpacing: "-0.05em",
            lineHeight: 1,
          }}
        >
          Outplay
        </div>
        <div
          style={{
            fontSize: 36,
            color: "#D84040",
            marginTop: 32,
          }}
        >
          ♜
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#6D6D75",
            marginTop: 24,
          }}
        >
          Arabic Chess Analysis
        </div>
      </div>
    ),
    size
  );
}
