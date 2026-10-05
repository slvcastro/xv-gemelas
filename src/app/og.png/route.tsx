import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Rendered once at build time (no database, no runtime cost) and served as a static PNG.
export const dynamic = "force-static";

const font = (file: string) => readFile(join(process.cwd(), "src/assets/fonts", file));

// Fixed "random" star field so every build produces the same card.
const STARS = [
  [70, 80, 3], [180, 520, 2], [260, 140, 2], [340, 470, 3], [120, 330, 2], [1080, 90, 3], [980, 520, 2],
  [1130, 300, 2], [900, 150, 2], [1040, 440, 3], [560, 60, 2], [640, 575, 2], [770, 95, 2], [460, 560, 2],
  [210, 230, 1], [1000, 230, 1], [850, 560, 1], [300, 600, 1], [1150, 560, 1], [40, 450, 1],
] as const;

export async function GET() {
  const [script, serif, serifItalic] = await Promise.all([
    font("great-vibes-latin-400-normal.woff"),
    font("playfair-display-latin-400-normal.woff"),
    font("playfair-display-latin-400-italic.woff"),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          background: "radial-gradient(ellipse at 50% 35%, #193B59 0%, #05214B 55%, #031634 100%)",
          fontFamily: "Playfair",
        }}
      >
        {STARS.map(([x, y, r], i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: r * 2,
              height: r * 2,
              borderRadius: r,
              background: i % 3 === 0 ? "#F0CB65" : "#D5E5EB",
              opacity: r === 1 ? 0.55 : 0.85,
            }}
          />
        ))}
        {/* Double gold frame (Satori has no `inset` shorthand) */}
        <div
          style={{ position: "absolute", top: 28, left: 28, right: 28, bottom: 28, border: "2px solid rgba(216,196,119,0.75)", display: "flex" }}
        />
        <div
          style={{ position: "absolute", top: 40, left: 40, right: 40, bottom: 40, border: "1px solid rgba(216,196,119,0.35)", display: "flex" }}
        />

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: 26, letterSpacing: 12, color: "#91B1C5" }}>NUESTROS XV AÑOS</div>
          <div style={{ display: "flex", alignItems: "center", marginTop: 18 }}>
            <div style={{ width: 120, height: 1, background: "#D8C477", opacity: 0.8 }} />
            <div style={{ width: 10, height: 10, margin: "0 16px", background: "#D8C477", transform: "rotate(45deg)" }} />
            <div style={{ width: 120, height: 1, background: "#D8C477", opacity: 0.8 }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", color: "#E6CF83", lineHeight: 1.25, marginTop: 6 }}>
            <span style={{ fontFamily: "GreatVibes", fontSize: 132 }}>Kelly</span>
            <span style={{ fontStyle: "italic", fontSize: 72, margin: "0 26px" }}>&amp;</span>
            <span style={{ fontFamily: "GreatVibes", fontSize: 132 }}>Kyara</span>
          </div>
          <div style={{ fontStyle: "italic", fontSize: 40, color: "#D5E5EB", marginTop: 4 }}>
            Sábado 28 de noviembre de 2026
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "GreatVibes", data: script, style: "normal", weight: 400 },
        { name: "Playfair", data: serif, style: "normal", weight: 400 },
        { name: "Playfair", data: serifItalic, style: "italic", weight: 400 },
      ],
    }
  );
}
