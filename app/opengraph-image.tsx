import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Outplay — تحليل شطرنج بالعربي";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ROOK_PATH =
  "M5998 11543 l-168 -3 0 -648 c0 -356 5 -688 10 -738 19 -179 79 -303 221 -459 195 -213 274 -409 348 -856 72 -430 90 -687 87 -1199 -2 -377 -5 -425 -34 -695 -39 -357 -44 -392 -88 -585 -99 -438 -192 -679 -330 -852 -53 -65 -75 -85 -241 -208 -60 -44 -94 -79 -127 -129 -71 -107 -77 -145 -68 -471 l7 -275 28 -48 c40 -67 91 -115 156 -146 l56 -26 1980 -3 c1287 -1 1998 1 2033 8 110 20 201 90 243 187 18 43 20 68 19 324 -1 343 -6 374 -93 487 -23 30 -89 90 -154 139 -206 156 -312 312 -402 596 -96 303 -174 719 -212 1137 -17 194 -20 931 -4 1147 34 458 116 930 195 1122 61 149 108 220 263 397 79 90 132 191 150 284 9 49 11 239 9 794 l-4 729 -291 -6 c-235 -4 -303 -8 -346 -22 -185 -57 -316 -203 -341 -377 -5 -35 -10 -121 -10 -191 0 -145 -10 -180 -67 -239 -44 -45 -88 -61 -163 -61 -95 0 -169 45 -213 128 -18 35 -22 64 -27 225 -7 194 -14 228 -63 312 -37 64 -128 145 -201 179 -87 41 -218 55 -384 41 -106 -9 -129 -14 -194 -45 -94 -45 -176 -129 -220 -224 -32 -67 -32 -70 -38 -263 -6 -221 -13 -245 -82 -305 -91 -77 -237 -65 -325 27 -51 52 -63 102 -63 254 0 73 -5 157 -11 186 -34 158 -164 301 -317 348 -65 20 -255 28 -524 23z m2418 -2198 c96 -48 144 -123 144 -225 0 -36 -5 -83 -10 -105 -6 -22 -30 -128 -54 -235 -43 -189 -57 -258 -111 -555 -14 -77 -32 -176 -40 -220 -17 -93 -50 -307 -70 -450 -7 -55 -29 -210 -49 -345 -46 -320 -63 -447 -81 -605 -16 -137 -33 -261 -65 -462 -11 -67 -29 -204 -40 -305 -12 -100 -25 -211 -31 -245 -5 -34 -20 -152 -33 -263 -16 -129 -30 -209 -40 -225 -19 -28 -70 -42 -100 -25 -47 24 -44 11 -101 495 -14 121 -34 281 -45 355 -11 74 -38 279 -60 455 -86 682 -101 791 -135 1022 -97 657 -188 1159 -276 1522 -21 90 -39 182 -39 206 0 55 43 138 91 177 71 57 71 57 605 58 l490 0 50 -25z";

async function loadCairoFont() {
  const css = await fetch(
    "https://fonts.googleapis.com/css2?family=Cairo:wght@700&display=swap",
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    }
  ).then((res) => res.text());

  const match = css.match(/src:\s*url\((https:\/\/[^)]+)\)/);
  if (!match) throw new Error("Cairo font URL not found");

  return fetch(match[1]).then((res) => res.arrayBuffer());
}

export default async function Image() {
  const cairoBold = await loadCairoFont();

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
        <div
          style={{
            position: "absolute",
            width: 900,
            height: 900,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(216,64,64,0.18) 0%, rgba(216,64,64,0.04) 45%, transparent 70%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />

        <svg
          width={140}
          height={140}
          viewBox="0 0 1575 1575"
          style={{ marginBottom: 32 }}
        >
          <g transform="translate(0,1575) scale(0.1,-0.1)" fill="#D84040">
            <path d={ROOK_PATH} />
          </g>
        </svg>

        <div
          style={{
            fontSize: 128,
            fontWeight: 700,
            color: "#EEEEEE",
            letterSpacing: "-0.05em",
            fontFamily: "Georgia, serif",
            lineHeight: 1,
            marginBottom: 24,
          }}
        >
          Outplay
        </div>

        <div
          style={{
            fontSize: 36,
            color: "#6D6D75",
            fontFamily: "Cairo",
            direction: "rtl",
            textAlign: "center",
          }}
        >
          تحليل شطرنج بالعربي — افهم كل غلطة وليه
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Cairo",
          data: cairoBold,
          style: "normal",
          weight: 700,
        },
      ],
    }
  );
}
