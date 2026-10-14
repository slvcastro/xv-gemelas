import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";

// Rendered once at build time (no database, no runtime cost) and served as a static JPEG: with the
// photos a PNG weighs ~800 kB, and WhatsApp skips previews that heavy.
export const dynamic = "force-static";

const font = (file: string) => readFile(join(process.cwd(), "src/assets/fonts", file));
/** Kelly and Kyara's retouched cut-outs (the cover's files), as PNG data URLs: Satori reads no AVIF/WebP. */
const photo = async (name: string) =>
  `data:image/png;base64,${(await sharp(join(process.cwd(), "public/fotos", `${name}.webp`)).png().toBuffer()).toString("base64")}`;

// Fixed "random" star field so every build produces the same card.
const STARS = [
  [70, 80, 3], [180, 520, 2], [260, 140, 2], [340, 470, 3], [120, 330, 2], [1080, 90, 3], [980, 520, 2],
  [1130, 300, 2], [900, 150, 2], [1040, 440, 3], [560, 60, 2], [640, 575, 2], [460, 560, 2],
  [210, 230, 1], [1000, 230, 1], [850, 560, 1], [300, 600, 1], [1150, 560, 1], [40, 450, 1],
] as const;

export async function GET() {
  const png = await card();
  const jpeg = await sharp(Buffer.from(await png.arrayBuffer()))
    .jpeg({ quality: 84, progressive: true, mozjpeg: true })
    .toBuffer();
  return new Response(new Uint8Array(jpeg), { headers: { "Content-Type": "image/jpeg" } });
}

async function card() {
  const [script, serif, serifItalic, kelly, kyara] = await Promise.all([
    font("great-vibes-latin-400-normal.woff"),
    font("playfair-display-latin-400-normal.woff"),
    font("playfair-display-latin-400-italic.woff"),
    photo("kelly"),
    photo("kyara"),
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
        {/* Light behind each of them */}
        <div style={{ position: "absolute", left: -60, top: 60, width: 560, height: 560, borderRadius: 280, background: "radial-gradient(circle, rgba(240,203,101,0.22), transparent 66%)" }} />
        <div style={{ position: "absolute", right: -60, top: 60, width: 560, height: 560, borderRadius: 280, background: "radial-gradient(circle, rgba(240,203,101,0.22), transparent 66%)" }} />
        {/* Kelly (left) and Kyara (right) turn towards each other, towards the names. */}
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori (ImageResponse) only understands <img> */}
        <img src={kelly} width={408} height={501} style={{ position: "absolute", left: 26, bottom: 30 }} alt="" />
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori (ImageResponse) only understands <img> */}
        <img src={kyara} width={408} height={501} style={{ position: "absolute", right: 26, bottom: 30 }} alt="" />

        {/* Double gold frame (Satori has no `inset` shorthand) */}
        <div
          style={{ position: "absolute", top: 28, left: 28, right: 28, bottom: 28, border: "2px solid rgba(216,196,119,0.75)", display: "flex" }}
        />
        <div
          style={{ position: "absolute", top: 40, left: 40, right: 40, bottom: 40, border: "1px solid rgba(216,196,119,0.35)", display: "flex" }}
        />

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: -36 }}>
          <div style={{ fontSize: 21, letterSpacing: 9, color: "#91B1C5" }}>NUESTROS XV AÑOS</div>
          <div style={{ display: "flex", alignItems: "center", marginTop: 16 }}>
            <div style={{ width: 90, height: 1, background: "#D8C477", opacity: 0.8 }} />
            <div style={{ width: 9, height: 9, margin: "0 14px", background: "#D8C477", transform: "rotate(45deg)" }} />
            <div style={{ width: 90, height: 1, background: "#D8C477", opacity: 0.8 }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", color: "#E6CF83", marginTop: 4 }}>
            <span style={{ fontFamily: "GreatVibes", fontSize: 112, lineHeight: 1.12 }}>Kelly</span>
            <span style={{ fontStyle: "italic", fontSize: 46, lineHeight: 1, margin: "-6px 0 4px" }}>&amp;</span>
            <span style={{ fontFamily: "GreatVibes", fontSize: 112, lineHeight: 1.12 }}>Kyara</span>
          </div>
          <div style={{ fontStyle: "italic", fontSize: 30, color: "#D5E5EB", marginTop: 6 }}>Sábado 28 de noviembre</div>
          <div style={{ fontSize: 24, letterSpacing: 8, color: "#D8C477", marginTop: 6 }}>2026</div>
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
