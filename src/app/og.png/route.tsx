import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// 日英で同じ絵なので、言語の付かない道筋に置く。拡張子があるので proxy も通らない。
export const dynamic = "force-static";

const size = { height: 630, width: 1200 };
// アイコンの地色。globals ではなくアイコンに合わせる。
const BLUE = "#1a73e8";

// 伏せたカード。表の 5 の両脇に、傾けて置く。
function Back({ rotate }: { rotate: number }): React.JSX.Element {
  return (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.14)",
        border: "3px solid rgba(255, 255, 255, 0.55)",
        borderRadius: 20,
        height: 220,
        margin: "0 22px",
        transform: `rotate(${rotate}deg) translateY(18px)`,
        width: 156,
      }}
    />
  );
}

export async function GET(): Promise<ImageResponse> {
  // satori は woff2 を読めないので、題字の字形だけを抜いた TTF を別に置いている。
  const courgette = await readFile(
    join(process.cwd(), "src/libs/fonts/courgette-og.ttf")
  );

  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: `radial-gradient(circle at 50% 38%, #4a90f0 0%, ${BLUE} 45%, #1459b8 100%)`,
        display: "flex",
        flexDirection: "column",
        fontFamily: "Courgette",
        height: "100%",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <div style={{ alignItems: "center", display: "flex" }}>
        <Back rotate={-10} />
        <div
          style={{
            alignItems: "center",
            background: "#fff",
            borderRadius: 20,
            boxShadow: "0 24px 48px rgba(8, 40, 100, 0.35)",
            color: BLUE,
            display: "flex",
            fontSize: 140,
            height: 236,
            justifyContent: "center",
            width: 168,
          }}
        >
          5
        </div>
        <Back rotate={10} />
      </div>
      <div
        style={{
          color: "#fff",
          fontSize: 88,
          letterSpacing: 1,
          marginTop: 56,
        }}
      >
        Planning Poker
      </div>
    </div>,
    {
      ...size,
      fonts: [{ data: courgette, name: "Courgette", weight: 400 }],
    }
  );
}
