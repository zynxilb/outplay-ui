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
          position: "relative",
        }}
      >
        {/* Red glow */}
        <div
          style={{
            position: "absolute",
            width: 800,
            height: 800,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(216,64,64,0.18) 0%, rgba(216,64,64,0.05) 45%, transparent 70%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />

        {/* Rook image from public */}
        <img
          src="https://outplay-ui-one.vercel.app/logo/rook.svg"
          width={130}
          height={130}
          alt=""
          style={{ marginBottom: 28 }}
        />

        {/* Outplay title */}
        <div
          style={{
            fontSize: 128,
            fontWeight: 700,
            color: "#EEEEEE",
            fontFamily: "Georgia, serif",
            letterSpacing: "-0.05em",
            lineHeight: 1,
          }}
        >
          Outplay
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 28,
            color: "#6D6D75",
            marginTop: 28,
          }}
        >
          Arabic Chess Analysis
        </div>
      </div>
    ),
    size
  );
}
