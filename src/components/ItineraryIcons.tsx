/* Ilustraciones del itinerario: dibujos de línea dorada (se trazan con la pluma) y zonas de color que
   se "colorean" una a una después. Server-safe: solo SVG; las animaciones son CSS (globals.css,
   "Itinerario"). Los degradados viven una sola vez en <ItineraryDefs/>. */
import type { ItineraryIcon } from "@/lib/event";

const r2 = (v: number) => Math.round(v * 100) / 100;

/** Four-pointed star with curved sides, centred on (x, y). */
const star = (x: number, y: number, r: number) =>
  `M${x} ${r2(y - r)}Q${x} ${y} ${r2(x + r)} ${y}Q${x} ${y} ${x} ${r2(y + r)}Q${x} ${y} ${r2(x - r)} ${y}Q${x} ${y} ${x} ${r2(y - r)}Z`;
const circle = (x: number, y: number, r: number) => `M${r2(x + r)} ${y}a${r} ${r} 0 1 1 ${-2 * r} 0a${r} ${r} 0 1 1 ${2 * r} 0Z`;

/** Gradients shared by every icon (one hidden SVG per page). */
export function ItineraryDefs() {
  const lin = (id: string, stops: [string, string, number?][], x2 = 0, y2 = 1) => (
    <linearGradient id={`it-${id}`} x1="0" y1="0" x2={x2} y2={y2}>
      {stops.map(([o, c, a], i) => (
        <stop key={i} offset={o} stopColor={c} stopOpacity={a ?? 1} />
      ))}
    </linearGradient>
  );
  return (
    <svg width="0" height="0" className="pointer-events-none absolute" aria-hidden="true" focusable="false">
      <defs>
        {lin("line", [["0", "#F6E7A8"], [".5", "#D8C477"], ["1", "#B29A5C"]], 1, 1)}
        {lin("gold", [["0", "#FBEFC0"], [".45", "#E6C764"], ["1", "#B08F45"]])}
        {lin("ivory", [["0", "#F4F8FB"], ["1", "#C9D9E3"]])}
        {lin("blue", [["0", "#22B7F6"], [".55", "#0C63E8"], ["1", "#0D41E2"]])}
        {lin("royal", [["0", "#0C63E8"], ["1", "#0A2F9E"]])}
        {lin("silver", [["0", "#FBFCFD"], [".4", "#D3D8DF"], [".7", "#EEF1F4"], ["1", "#98A1AD"]], 1, 1)}
        {lin("champagne", [["0", "#FCE7A6"], ["1", "#E2B44E"]])}
        {lin("night", [["0", "#0A2F6E"], ["1", "#164C9C"]])}
        <radialGradient id="it-glow" cx=".5" cy=".55" r=".6">
          <stop offset="0" stopColor="#FFF6D6" />
          <stop offset=".55" stopColor="#FFD77F" />
          <stop offset="1" stopColor="#F0A93B" stopOpacity=".85" />
        </radialGradient>
        <radialGradient id="it-ball" cx=".38" cy=".32" r=".75">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset=".45" stopColor="#D6DCE3" />
          <stop offset="1" stopColor="#7E8896" />
        </radialGradient>
      </defs>
    </svg>
  );
}

type Shape = { d: string; fill: string; opacity?: number };
type Art = { fills: Shape[]; lines: string[]; /** thin white highlights drawn last */ shine?: string[] };

const g = (id: string) => `url(#it-${id})`;

const ART: Record<ItineraryIcon, Art> = {
  // Misa: the church, its rose window and side windows glowing warm.
  church: {
    fills: [
      { d: "M20.5 9.5h7v8.6h-7Z", fill: g("ivory") },
      { d: "M19.5 9.5 24 4.5l4.5 5Z", fill: g("blue") },
      { d: "M11 25h26v19H11Z", fill: g("ivory") },
      { d: "M7.5 26.5 24 15l16.5 11.5Z", fill: g("blue") },
      { d: "M20.5 44v-5.5a3.5 3.5 0 0 1 7 0v5.5Z", fill: g("gold") },
      { d: circle(24, 30, 2.3), fill: g("glow") },
      { d: "M14 39.5V35a1.5 1.5 0 0 1 3 0v4.5ZM31 39.5V35a1.5 1.5 0 0 1 3 0v4.5Z", fill: g("glow") },
    ],
    lines: [
      "M24 .8v3.7M22.2 2.4h3.6",
      "M19.5 9.5 24 4.5l4.5 5M20.5 9.5v7.9M27.5 9.5v7.9",
      "M7.5 26.5 24 15l16.5 11.5",
      "M11 25.3V44M37 25.3V44M5 44h38",
      "M20.5 44v-5.5a3.5 3.5 0 0 1 7 0v5.5",
      circle(24, 30, 2.3) + "M24 27.7v4.6M21.7 30h4.6",
      "M14 39.5V35a1.5 1.5 0 0 1 3 0v4.5ZM31 39.5V35a1.5 1.5 0 0 1 3 0v4.5Z",
    ],
  },
  // Recepción en Villa Cielo: an arched portal under the night sky, warm light and a crescent moon inside.
  reception: {
    fills: [
      { d: "M12.5 44V24a11.5 11.5 0 0 1 23 0v20Z", fill: g("glow"), opacity: 0.9 },
      { d: "M8.5 24a15.5 15.5 0 0 1 31 0h-4a11.5 11.5 0 0 0-23 0Z", fill: g("royal") },
      { d: "M8.5 24h4v20h-4ZM35.5 24h4v20h-4Z", fill: g("ivory") },
      { d: "M27.2 27.8A5 5 0 1 1 23.6 19a6.2 6.2 0 0 0 3.6 8.8Z", fill: g("gold") },
      { d: star(6, 9, 3.2) + star(42, 11, 2.6) + star(24, 3.2, 2), fill: g("gold") },
    ],
    lines: [
      "M8.5 44V24a15.5 15.5 0 0 1 31 0v20",
      "M12.5 44V24a11.5 11.5 0 0 1 23 0v20",
      "M6.5 24h8M33.5 24h8M5 44h38M7 41h34",
      "M27.2 27.8A5 5 0 1 1 23.6 19a6.2 6.2 0 0 0 3.6 8.8Z",
      star(6, 9, 3.2) + star(42, 11, 2.6) + star(24, 3.2, 2),
    ],
  },
  // Presentación de las quinceañeras: a tiara with a blue gem and silver pearls (their colours).
  tiara: {
    fills: [
      { d: "M8 34 11.5 24.5 17 30.5 24 13.5 31 30.5 36.5 24.5 40 34Q24 39.5 8 34Z", fill: g("gold") },
      { d: "M8 34Q24 39.5 40 34l-.5 3.6Q24 43.2 8.5 37.6Z", fill: g("champagne") },
      { d: "M24 21.2 27.2 26 24 30.8 20.8 26Z", fill: g("blue") },
      { d: circle(15.8, 33, 1.4) + circle(32.2, 33, 1.4), fill: g("blue") },
      { d: circle(11.5, 22.6, 1.6) + circle(36.5, 22.6, 1.6) + circle(24, 11.3, 1.9), fill: g("silver") },
    ],
    lines: [
      "M8 34 11.5 24.5 17 30.5 24 13.5 31 30.5 36.5 24.5 40 34",
      "M8 34Q24 39.5 40 34M8.5 37.6Q24 43.2 39.5 37.6M8 34l.5 3.6M40 34l-.5 3.6",
      "M24 21.2 27.2 26 24 30.8 20.8 26Z",
      circle(11.5, 22.6, 1.6) + circle(36.5, 22.6, 1.6) + circle(24, 11.3, 1.9),
      circle(15.8, 33, 1.4) + circle(32.2, 33, 1.4),
    ],
    shine: ["M22.6 24.6 24 22.6"],
  },
  // Brindis: two champagne flutes that meet with a sparkle (each flute is the same glass, tilted 16°).
  toast: {
    fills: [
      { d: "M15.21 15.79 22.59 17.9 20.04 24.46Q18.36 28.14 15.87 27.42Q13.37 26.7 13.89 22.69Z", fill: g("champagne") },
      { d: "M25.41 17.9 32.79 15.79 34.11 22.69Q34.63 26.7 32.13 27.42Q29.64 28.14 27.96 24.46Z", fill: g("champagne") },
      { d: circle(17.11, 19.45, 0.75) + circle(18.07, 23.37, 0.6) + circle(28.97, 20, 0.75) + circle(31.86, 22.82, 0.6), fill: "#FFFDF4" },
      { d: star(24, 7, 3.6), fill: g("gold") },
    ],
    lines: [
      "M15.96 11.84 24.04 14.16 20.04 24.46Q18.36 28.14 15.87 27.42Q13.37 26.7 13.89 22.69Z",
      "M23.96 14.16 32.04 11.84 34.11 22.69Q34.63 26.7 32.13 27.42Q29.64 28.14 27.96 24.46Z",
      "M15.87 27.42 12.56 38.95M7.59 38.15Q12.86 37.9 17.2 40.91M32.13 27.42l3.31 11.53M30.8 40.91Q35.14 37.9 40.41 38.15",
      star(24, 7, 3.6) + "M18.8 6.5 17 5M29.2 6.5 31 5M24 1.6V.4",
    ],
  },
  // Vals: a ball gown twirling to the music.
  waltz: {
    fills: [
      {
        d: "M21.5 19Q15 27 9.5 37Q12 40.5 15.5 39Q18.5 42 21.5 40Q24 42.5 26.5 40Q29.5 42 32.5 39Q36 40.5 38.5 37Q33 27 26.5 19Z",
        fill: g("blue"),
      },
      { d: "M21.5 19 20.5 12Q24 10.6 27.5 12L26.5 19Z", fill: g("royal") },
      { d: "M21.3 18h5.4v2h-5.4Z", fill: g("silver") },
      { d: circle(17.5, 31, 0.6) + circle(29.5, 29, 0.6) + circle(24, 35.5, 0.6) + circle(33, 35, 0.5), fill: "#FFFFFF" },
      { d: circle(39.5, 11.5, 2.1), fill: g("gold") },
    ],
    lines: [
      "M21.5 19Q15 27 9.5 37Q12 40.5 15.5 39Q18.5 42 21.5 40Q24 42.5 26.5 40Q29.5 42 32.5 39Q36 40.5 38.5 37Q33 27 26.5 19",
      "M23 21Q20 30 15.5 39M25 21Q28 30 32.5 39M24 20.5V41",
      "M21.5 19 20.5 12Q24 10.6 27.5 12L26.5 19M20.7 12l.8-3.5M27.3 12l-.8-3.5M21.3 18h5.4v2h-5.4Z",
      "M6.5 26Q3.6 32.5 6.5 39.5M41.5 26Q44.4 32.5 41.5 39.5M3.6 30Q2.4 33 3.6 36",
      circle(39.5, 11.5, 2.1) + "M41.6 11.5V4.2Q43.8 4.8 44.6 7",
    ],
  },
  // Baile sorpresa y cena: a silver cloche on a golden tray, with sparks of surprise.
  surprise: {
    fills: [
      { d: "M9 33a15 15 0 0 1 30 0Z", fill: g("silver") },
      { d: circle(24, 16.2, 2), fill: g("gold") },
      { d: "M5.5 33h37Q41.5 36.5 38 36.5H10Q6.5 36.5 5.5 33Z", fill: g("gold") },
      { d: star(8.5, 11.5, 3.4) + star(40, 9, 2.8) + star(33, 3.6, 1.8), fill: g("gold") },
      { d: "M14.2 6.2l1.6-.9.6 1.1-1.6.9ZM44 18.5l.9 1.6-1.1.6-.9-1.6ZM4.6 20.4l1.7.5-.4 1.2-1.7-.5Z", fill: "#22B7F6" },
    ],
    lines: [
      "M9 33a15 15 0 0 1 30 0",
      circle(24, 16.2, 2),
      "M5.5 33h37Q41.5 36.5 38 36.5H10Q6.5 36.5 5.5 33ZM11 39.8h26",
      star(8.5, 11.5, 3.4) + star(40, 9, 2.8) + star(33, 3.6, 1.8),
    ],
    shine: ["M14.6 29.6A10 10 0 0 1 19.4 22.4"],
  },
  // Apertura de la pista: the mirror ball, catching coloured lights.
  dance: {
    fills: [
      { d: circle(24, 25, 13), fill: g("ball") },
      { d: "M17.2 17.6h4v3.4h-4Z", fill: "#22B7F6", opacity: 0.85 },
      { d: "M26.6 21.4h4v3.4h-4Z", fill: "#F0CB65", opacity: 0.9 },
      { d: "M19.8 28.8h4v3.2h-4Z", fill: "#F3A9C6", opacity: 0.85 },
      { d: "M29.2 29.8h3.4v3h-3.4Z", fill: "#0C63E8", opacity: 0.85 },
      { d: "M13.6 23.6h3v3.4h-3Z", fill: "#FBEFC0", opacity: 0.9 },
      { d: star(7.5, 9.5, 3) + star(41.5, 12, 2.4) + star(40.5, 41, 2), fill: g("gold") },
    ],
    lines: [
      circle(24, 25, 13) + "M24 2.6V12",
      "M14.62 16Q24 17.6 33.38 16M11.77 20.6Q24 23.4 36.23 20.6M11.01 25.6Q24 28.6 36.99 25.6M12.37 30.8Q24 33.6 35.63 30.8M16.2 35.4Q24 37 31.8 35.4",
      "M24 12V38M24 12Q15 25 24 38M24 12Q33 25 24 38M24 12Q9.5 25 24 38M24 12Q38.5 25 24 38",
      star(7.5, 9.5, 3) + star(41.5, 12, 2.4) + star(40.5, 41, 2) + "M9.5 41.5 6 45M14 44.5l-1.5 2",
    ],
  },
};

/**
 * One illustration. `start` is when its pen starts (s after the item enters the screen); the lines
 * draw first, then each coloured zone fills in, like a drawing being coloured.
 */
export function ItineraryArt({ icon, start = 0 }: { icon: ItineraryIcon; start?: number }) {
  const art = ART[icon];
  const lineEnd = start + 0.2 + art.lines.length * 0.09;
  return (
    <svg viewBox="0 0 48 48" className="h-full w-full overflow-visible" aria-hidden="true" focusable="false">
      <g>
        {art.fills.map((f, i) => (
          <path
            key={i}
            className="it-fill"
            d={f.d}
            fill={f.fill}
            fillOpacity={f.opacity}
            style={{ "--d": `${r2(lineEnd + i * 0.1)}s` } as React.CSSProperties}
          />
        ))}
      </g>
      <g fill="none" stroke={g("line")} strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round">
        {art.lines.map((d, i) => (
          <path key={i} className="it-line" d={d} pathLength={1} style={{ "--d": `${r2(start + i * 0.09)}s` } as React.CSSProperties} />
        ))}
      </g>
      {art.shine && (
        <g fill="none" stroke="#FFFFFF" strokeOpacity=".8" strokeWidth="1" strokeLinecap="round">
          {art.shine.map((d, i) => (
            <path key={i} className="it-fill" d={d} style={{ "--d": `${r2(lineEnd + art.fills.length * 0.1)}s` } as React.CSSProperties} />
          ))}
        </g>
      )}
    </svg>
  );
}
