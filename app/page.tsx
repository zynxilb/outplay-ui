// app/page.tsx
import Link from "next/link";

const COLORS = {
  bg: "#161512",
  surface: "#232120",
  border: "#3d3a37",
  text: "#bababa",
  muted: "#7d7a76",
  accent: "#81B64C",
};

export default function Home() {
  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: COLORS.bg,
        color: COLORS.text,
        padding: "48px 20px",
        fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: "480px" }}>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: 700,
            margin: "0 0 8px",
            color: "#e8e8e8",
            textAlign: "center",
          }}
        >
          Outplay
        </h1>
        <p
          style={{
            color: COLORS.muted,
            fontSize: "14px",
            margin: "0 0 40px",
            textAlign: "center",
          }}
        >
          حلل مبارياتك، افهم غلطاتك
        </p>

        <div
          style={{
            display: "grid",
            gap: "12px",
            gridTemplateColumns: "1fr",
          }}
        >
          <Link
            href="/import"
            style={{
              display: "block",
              background: COLORS.accent,
              color: "#161512",
              padding: "18px 20px",
              borderRadius: "10px",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "16px",
              textAlign: "center",
            }}
          >
            حلل مباراة PGN
          </Link>

          <Link
            href="/play"
            style={{
              display: "block",
              background: COLORS.surface,
              color: COLORS.text,
              border: `1px solid ${COLORS.border}`,
              padding: "18px 20px",
              borderRadius: "10px",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "16px",
              textAlign: "center",
            }}
          >
            العب على الرقعة
          </Link>
        </div>
      </div>
    </main>
  );
}
