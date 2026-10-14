import { Sparkle, Sunburst, fxDelay } from "@/components/decor";
import { TwinPicture } from "@/components/TwinPicture";

type Twin = {
  name: string;
  /** Files in public/fotos (retouched cut-outs with a transparent background, 600×737). */
  file: string;
  /** Centre of the tiara, in % of the picture. */
  tiara: [number, number];
  /** Sequins on the skirt that catch the light now and then, in % of the picture. */
  glints: [number, number][];
};

// Kelly looks to her left and Kyara to her right: side by side, they turn towards each other.
const TWINS: [Twin, Twin] = [
  { name: "Kelly", file: "kelly", tiara: [50, 6], glints: [[34, 54], [70, 53], [26, 77], [51, 72], [80, 87], [59, 42]] },
  { name: "Kyara", file: "kyara", tiara: [48.5, 6], glints: [[29, 52], [72, 54], [26, 82], [56, 74], [83, 82], [64, 38]] },
];

/** How long a picture takes to materialise, from the hem to the tiara (matches `.twin-img` in CSS). */
const REVEAL = 1.7;

const r2 = (v: number) => Math.round(v * 100) / 100;
/** Fixed pseudo-random numbers in [0, 1): the same "random" dust on every render. */
const rand = (i: number, k: number) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/** Golden dust that rises from the hem while the picture materialises. */
function Dust({ start, seed }: { start: number; seed: number }) {
  return Array.from({ length: 12 }, (_, n) => {
    const i = n + seed * 12;
    const size = r2(2 + rand(i, 4) * 2.5);
    // The particle sits at the bottom of a column as tall as its climb; the column rises its own height.
    const style = {
      left: `${r2(10 + rand(i, 1) * 80)}%`,
      bottom: `${r2(2 + rand(i, 7) * 14)}%`,
      height: `${r2(40 + rand(i, 2) * 50)}%`,
      "--dx": `${r2((rand(i, 3) - 0.5) * 28)}px`,
      "--t": `${r2(1.3 + rand(i, 6) * 0.9)}s`,
      ...fxDelay(r2(start - 0.1 + rand(i, 5) * 1.3)),
    } as React.CSSProperties;
    return (
      <span key={n} className="twin-dust pointer-events-none absolute w-0" style={style} aria-hidden="true">
        <span
          className="absolute bottom-0 rounded-full bg-[#fff3c4] shadow-[0_0_6px_2px_rgba(240,203,101,0.65)]"
          style={{ width: size, height: size, left: -size / 2 }}
        />
      </span>
    );
  });
}

function Figure({ twin, start, seed, className = "" }: { twin: Twin; start: number; seed: number; className?: string }) {
  const done = r2(start + REVEAL);
  return (
    <div className={`relative aspect-[600/737] w-[var(--fw)] shrink-0 ${className}`}>
      <TwinPicture file={twin.file} alt={`${twin.name} con su vestido de XV años`} className="twin-img" style={fxDelay(start)} />
      {/* A golden copy of the picture lights up the edge that is materialising. */}
      <span aria-hidden="true">
        <TwinPicture file={twin.file} alt="" className="twin-glow" style={fxDelay(start)} />
      </span>
      <Dust start={start} seed={seed} />

      {/* The tiara shines once, then catches the light now and then (two stars: one animation each, so
          both stay on the compositor). */}
      <Sparkle
        className="spark absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-[#fffbe8] md:h-4 md:w-4"
        style={{ left: `${twin.tiara[0]}%`, top: `${twin.tiara[1] - 1}%`, ...fxDelay(r2(done - 0.2)) }}
      />
      <Sparkle
        className="twin-glint absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 text-[#fffbe8] md:h-3.5 md:w-3.5"
        style={{ left: `${twin.tiara[0]}%`, top: `${twin.tiara[1] - 1}%`, ...fxDelay(r2(done + 2.4 + seed * 1.3)) }}
      />
      {twin.glints.map(([x, y], i) => (
        <Sparkle
          key={i}
          className={`twin-glint absolute -translate-x-1/2 -translate-y-1/2 text-[#fffbe8] ${i % 2 ? "h-2 w-2" : "h-2.5 w-2.5"}`}
          style={{ left: `${x}%`, top: `${y}%`, ...fxDelay(r2(done + 0.4 + ((i * 1.7 + seed * 0.9) % 5))) }}
        />
      ))}
    </div>
  );
}

/**
 * Kelly and Kyara on the cover, revealed when the envelope opens, like a fairy-tale transformation:
 * rays of light open behind them, golden dust rises from the floor and each one materialises from
 * the hem of her dress up to her tiara, with a line of golden light at the edge; then each tiara
 * shines and, from time to time, a sequin of the dresses catches the light. Kyara follows Kelly by a
 * breath. Pure CSS (globals.css, "Gemelas"): with reduced motion the picture is simply shown.
 * Server component.
 */
export function TwinReveal({ start = 1.15 }: { start?: number }) {
  const [kelly, kyara] = TWINS;
  return (
    <div className="relative mt-4 flex justify-center [--fw:min(calc((100vw_-_4rem)/1.83),13rem)] md:mt-3 md:[--fw:15rem] md:tall:mt-5 md:tall:[--fw:17.5rem] short:mt-3 short:[--fw:clamp(6.5rem,calc((100svh_-_13.25rem)_*_0.81),10rem)]">
      <div
        className="twin-rays pointer-events-none absolute left-1/2 top-[30%] aspect-square w-[185%] -translate-x-1/2 -translate-y-1/2"
        style={fxDelay(r2(start - 0.15))}
        aria-hidden="true"
      >
        <Sunburst className="h-full w-full text-gold opacity-40" inner={3} />
        {/* The star the rays come from, between the two of them: they turn towards its light. */}
        <span className="absolute left-1/2 top-1/2 aspect-square w-[30%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,246,214,0.9),rgba(240,203,101,0.38)_9%,rgba(216,196,119,0.1)_32%,transparent_66%)]" />
        <Sparkle className="twin-star absolute left-1/2 top-1/2 -ml-2 -mt-2 h-4 w-4 text-[#fffbe8]" />
      </div>
      {/* Pool of light at their feet */}
      <span
        className="twin-pool pointer-events-none absolute inset-x-[-12%] bottom-[-9%] h-[34%] bg-[radial-gradient(ellipse_50%_50%_at_50%_62%,rgba(240,203,101,0.3),rgba(216,196,119,0.08)_55%,transparent_75%)]"
        style={fxDelay(r2(start + 0.2))}
        aria-hidden="true"
      />

      <Figure twin={kelly} start={start} seed={0} />
      {/* Overlap 0.17 fw: the pair is 1.83 fw wide (the 1.83 in --fw and in TwinPicture's sizes). */}
      <Figure twin={kyara} start={r2(start + 0.3)} seed={1} className="-ml-[calc(var(--fw)*0.17)]" />

      {/* Stepped floor: two lines that open from the centre */}
      <span className="pointer-events-none absolute inset-x-0 -bottom-2 flex flex-col items-center gap-[5px]" aria-hidden="true">
        <span className="fx-grow-c block h-px w-[86%] bg-gradient-to-r from-transparent via-gold/75 to-transparent" style={fxDelay(r2(start + 0.1))} />
        <span className="fx-grow-c block h-px w-[64%] bg-gradient-to-r from-transparent via-gold/45 to-transparent" style={fxDelay(r2(start + 0.25))} />
      </span>
    </div>
  );
}
