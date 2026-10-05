/* Emblema "sobre de lacre" y firma caligráfica "Kelly & Kyara". Todo es SVG y server-safe (sin hooks):
   se renderiza en el servidor y las animaciones son CSS (globals.css), así arrancan con el primer pintado. */
import { NAME_INK, NAME_STROKES, NAME_VIEWBOX, SEAL } from "@/components/emblemData";

const [VX, VY, VW, VH] = NAME_VIEWBOX.split(" ").map(Number);
const t3 = (v: number) => `${Math.round(v * 1000) / 1000}s`;

/**
 * Sprite compartido (una vez por página): el contorno de las letras y la lámina dorada.
 * Las firmas lo reutilizan con <use>, así el trazado (~11 kB) no se repite en cada una.
 */
export function NameDefs() {
  return (
    <svg width="0" height="0" className="pointer-events-none absolute" aria-hidden="true" focusable="false">
      <defs>
        <path id="kk-ink" d={NAME_INK} />
        <linearGradient id="kk-gold" gradientUnits="userSpaceOnUse" x1={VX} y1={VY} x2={VX + VW} y2={VY + VH * 0.7}>
          <stop offset="0" stopColor="#b29a5c" />
          <stop offset=".2" stopColor="#d8c477" />
          <stop offset=".36" stopColor="#f6e7a8" />
          <stop offset=".52" stopColor="#c9b264" />
          <stop offset=".67" stopColor="#f0cb65" />
          <stop offset=".84" stopColor="#c3aa62" />
          <stop offset="1" stopColor="#e2cf86" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Pen lifts: a short pause between letters and a longer one between words.
const WORD_BREAK_AFTER = new Set([6, 8]); // after "Kelly" (2nd y stroke) and after "&"
const SAME_GLYPH = new Set([0, 5, 7, 9, 11]); // K→K, y→y, &→&, K→K, y→y (no lift)

/** Delay and duration of each pen stroke so the nib moves at a steady speed. */
function penTiming(start: number, duration: number) {
  const lifts = NAME_STROKES.slice(0, -1).map((_, i) => (SAME_GLYPH.has(i) ? 0.4 : WORD_BREAK_AFTER.has(i) ? 2.6 : 1));
  const liftUnits = lifts.reduce((a, b) => a + b, 0);
  const liftTime = duration * 0.15;
  const writeTime = duration - liftTime;
  const total = NAME_STROKES.reduce((a, [, len]) => a + len, 0);
  let t = start;
  return NAME_STROKES.map(([, len], i) => {
    const dur = (writeTime * len) / total;
    const o = { delay: t, dur };
    t += dur + (i < lifts.length ? (liftTime * lifts[i]) / liftUnits : 0);
    return o;
  });
}

/**
 * "Kelly & Kyara" en tinta dorada. Con `pen`, una máscara recorre el esqueleto de cada letra en el
 * orden en que se escribe (la tinta aparece como trazada con pluma) y, con `nib`, un destello
 * acompaña a la punta. El estado final (sin animación / movimiento reducido) es la firma completa.
 * `id` debe ser único en la página.
 */
export function SignedName({
  id,
  className = "",
  pen,
}: {
  id: string;
  className?: string;
  pen?: { start: number; duration: number; nib?: boolean };
}) {
  if (!pen) {
    return (
      <svg viewBox={NAME_VIEWBOX} className={`block overflow-visible ${className}`} aria-hidden="true" focusable="false">
        <use href="#kk-ink" fill="url(#kk-gold)" />
      </svg>
    );
  }
  const timing = penTiming(pen.start, pen.duration);
  const end = pen.start + pen.duration;
  const vars = (i: number) => ({ "--d": t3(timing[i].delay), "--t": t3(timing[i].dur) }) as React.CSSProperties;
  return (
    <svg
      viewBox={NAME_VIEWBOX}
      className={`block overflow-visible ${className}`}
      style={{ "--sig-end": t3(end) } as React.CSSProperties}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <mask id={`${id}-pen`} maskUnits="userSpaceOnUse" x={VX - 10} y={VY - 10} width={VW + 20} height={VH + 20}>
          <g fill="none" stroke="#fff" strokeWidth="9.5" strokeLinecap="round" strokeLinejoin="round">
            {NAME_STROKES.map(([d], i) => (
              <path key={i} d={d} pathLength={1} className="sig-stroke" style={vars(i)} />
            ))}
          </g>
        </mask>
      </defs>
      <use href="#kk-ink" fill="url(#kk-gold)" mask={`url(#${id}-pen)`} />
      {/* Ink fully settled at the end (covers any hairline the mask misses). */}
      <use href="#kk-ink" fill="url(#kk-gold)" className="sig-settle" />
      {pen.nib && (
        <g fill="none" stroke="#fffbe8" strokeWidth="2.6" strokeLinecap="round">
          {NAME_STROKES.map(([d], i) => (
            <path key={i} d={d} pathLength={1} className="sig-nib" style={vars(i)} />
          ))}
        </g>
      )}
    </svg>
  );
}

/** Wax art (gradients + shapes) for a seal whose defs use the given id prefix. */
function SealArt({ id }: { id: string }) {
  const relief = (children: React.ReactNode, fill: string) => (
    <>
      <g transform="translate(.55 .7)" fill="#4f3c13" color="#4f3c13" opacity=".85">
        {children}
      </g>
      <g transform="translate(-.4 -.5)" fill="#fff7d6" color="#fff7d6" opacity=".8">
        {children}
      </g>
      <g fill={fill} color="#e9cf86">
        {children}
      </g>
    </>
  );
  return (
    <>
      <ellipse cx="1.8" cy="3.6" rx="49" ry="48" fill={`url(#${id}-sh)`} />
      <path d={SEAL.blob} fill={`url(#${id}-w)`} />
      <path d={SEAL.blob} fill={`url(#${id}-rim)`} />
      <path d="M-38 -14A40 40 0 0 1 -14 -38" fill="none" stroke="#fff8dc" strokeOpacity=".42" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M37 18A40 40 0 0 1 20 36" fill="none" stroke="#5a4518" strokeOpacity=".3" strokeWidth="2.6" strokeLinecap="round" />
      <circle r="33" fill={`url(#${id}-i)`} />
      <circle r="33" fill="none" stroke={`url(#${id}-e)`} strokeWidth="1.8" />
      {relief(<path d={SEAL.beads} />, `url(#${id}-m)`)}
      {relief(<path d="M29.6 0a29.6 29.6 0 1 0-59.2 0a29.6 29.6 0 1 0 59.2 0ZM28.7 0a28.7 28.7 0 1 0-57.4 0a28.7 28.7 0 1 0 57.4 0Z" fillRule="evenodd" />, `url(#${id}-m)`)}
      {relief(
        <>
          <path d={SEAL.monogram} stroke="currentColor" strokeWidth="0.7" />
          <path d={SEAL.star} />
          <path d={SEAL.rule} />
        </>,
        `url(#${id}-m)`
      )}
    </>
  );
}

function SealGradients({ id }: { id: string }) {
  return (
    <>
      <radialGradient id={`${id}-sh`} cx="50%" cy="50%" r="50%">
        <stop offset=".78" stopColor="#000" stopOpacity=".55" />
        <stop offset="1" stopColor="#000" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${id}-w`} cx="34%" cy="28%" r="78%">
        <stop offset="0" stopColor="#fff4c9" />
        <stop offset=".2" stopColor="#ecd590" />
        <stop offset=".46" stopColor="#d4b566" />
        <stop offset=".72" stopColor="#b09148" />
        <stop offset=".9" stopColor="#8a6f33" />
        <stop offset="1" stopColor="#6d5625" />
      </radialGradient>
      <radialGradient id={`${id}-rim`} cx="50%" cy="50%" r="50%">
        <stop offset=".66" stopColor="#4a3912" stopOpacity=".45" />
        <stop offset=".76" stopColor="#4a3912" stopOpacity="0" />
        <stop offset=".93" stopColor="#fff" stopOpacity="0" />
        <stop offset="1" stopColor="#3e2f0e" stopOpacity=".35" />
      </radialGradient>
      <linearGradient id={`${id}-i`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#7d6430" />
        <stop offset=".55" stopColor="#a98b45" />
        <stop offset="1" stopColor="#ccb066" />
      </linearGradient>
      <linearGradient id={`${id}-e`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#5f4a1c" />
        <stop offset=".5" stopColor="#a68a45" />
        <stop offset="1" stopColor="#fff0bf" />
      </linearGradient>
      <linearGradient id={`${id}-m`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fff2c2" />
        <stop offset=".5" stopColor="#ecd38c" />
        <stop offset="1" stopColor="#cfb062" />
      </linearGradient>
    </>
  );
}

/** Sello de lacre dorado con el monograma "K & K" en relieve. */
export function WaxSeal({ id, className = "" }: { id: string; className?: string }) {
  return (
    <svg viewBox="-52 -52 104 104" className={`overflow-visible ${className}`} aria-hidden="true" focusable="false">
      <defs>
        <SealGradients id={id} />
      </defs>
      <SealArt id={id} />
    </svg>
  );
}

// Jagged crack from top to bottom; the two halves are clipped on either side of it.
const CRACK: [number, number][] = [
  [1.5, -56], [-1.5, -38], [3, -25], [-2.5, -12], [1.5, -1], [-3, 11], [2, 24], [-1, 37], [1, 56],
];
const crackLine = `M${CRACK.map((p) => p.join(" ")).join("L")}`;
const halfClip = (side: -1 | 1) => `${crackLine}L${side * 60} 56L${side * 60} -56Z`;

/**
 * Sello del sobre, preparado para romperse: dos mitades recortadas por una grieta irregular
 * (cada una en su propia capa para moverla con transform), más un brillo y la grieta que se dibuja.
 * En reposo se ve como un solo sello.
 */
export function SplitWaxSeal({ id, className = "" }: { id: string; className?: string }) {
  return (
    <div className={`seal relative ${className}`} aria-hidden="true">
      <span className="seal-glow pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[260%] -translate-x-1/2 -translate-y-1/2 rounded-full" />
      <span className="seal-ripple pointer-events-none absolute inset-[-6%] rounded-full border border-gold/70" />
      <svg viewBox="-52 -52 104 104" className="seal-half seal-half-l absolute inset-0 h-full w-full overflow-visible" focusable="false">
        <defs>
          <SealGradients id={id} />
          <clipPath id={`${id}-cl`}>
            <path d={halfClip(-1)} />
          </clipPath>
          <clipPath id={`${id}-cr`}>
            <path d={halfClip(1)} />
          </clipPath>
          <clipPath id={`${id}-cb`}>
            <path d={SEAL.blob} />
          </clipPath>
          <linearGradient id={`${id}-gl`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fffbe8" stopOpacity="0" />
            <stop offset=".5" stopColor="#fffbe8" stopOpacity=".95" />
            <stop offset="1" stopColor="#fffbe8" stopOpacity="0" />
          </linearGradient>
          <g id={`${id}-art`}>
            <SealArt id={id} />
          </g>
        </defs>
        <use href={`#${id}-art`} clipPath={`url(#${id}-cl)`} />
      </svg>
      <svg viewBox="-52 -52 104 104" className="seal-half seal-half-r absolute inset-0 h-full w-full overflow-visible" focusable="false">
        <use href={`#${id}-art`} clipPath={`url(#${id}-cr)`} />
      </svg>
      <svg viewBox="-52 -52 104 104" className="seal-fx absolute inset-0 h-full w-full overflow-visible" focusable="false">
        <g clipPath={`url(#${id}-cb)`}>
          <g transform="rotate(24)">
            <rect className="seal-glint" x="-90" y="-80" width="26" height="160" fill={`url(#${id}-gl)`} />
          </g>
        </g>
        <path className="seal-crack" d={crackLine} pathLength={1} fill="none" stroke="#3d2e0c" strokeWidth="1.3" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
