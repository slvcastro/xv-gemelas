import { Fragment } from "react";

/** Seconds InkWords takes to write `text` with the same perChar/max (to chain what comes after). */
export function inkDuration(text: string, perChar = 0.055, max = 1.1) {
  const words = text.trim().split(/\s+/);
  const chars = words.reduce((a, w) => a + w.length, 0) || 1;
  return Math.min(max, Math.max(0.55, chars * perChar));
}

/**
 * Texto que se "escribe" en tinta: cada palabra se descubre de izquierda a derecha con un borde
 * suave (máscara) mientras un destello recorre la punta. Las palabras van en orden de lectura, así
 * funciona aunque el texto se parta en varias líneas. Sin animación (o con movimiento reducido)
 * el texto se ve completo.
 */
export function InkWords({
  text,
  start = 0,
  perChar = 0.055,
  max = 1.1,
  className = "",
}: {
  text: string;
  /** Segundos antes de empezar a escribir. */
  start?: number;
  perChar?: number;
  /** Duración máxima total, para que los nombres largos no hagan esperar. */
  max?: number;
  className?: string;
}) {
  const words = text.trim().split(/\s+/);
  const chars = words.reduce((a, w) => a + w.length, 0) || 1;
  const gap = 0.06;
  const total = Math.min(max, Math.max(0.55, chars * perChar));
  const write = Math.max(0.3, total - gap * (words.length - 1));
  // Pen timing per word (computed up front: the pen moves at a steady speed with a short lift between words).
  const timed: { w: string; d: number; dur: number }[] = [];
  let t = start;
  for (const w of words) {
    const dur = (write * w.length) / chars;
    timed.push({ w, d: t, dur });
    t += dur + gap;
  }
  return (
    <span className={className}>
      {timed.map(({ w, d, dur }, i) => {
        const style = { "--d": `${Math.round(d * 1000) / 1000}s`, "--t": `${Math.round(dur * 1000) / 1000}s` } as React.CSSProperties;
        return (
          <Fragment key={i}>
            {i > 0 && " "}
            <span className="ink-w" style={style}>
              <span className="ink-w-txt">{w}</span>
              <span className="ink-w-nib" aria-hidden="true" />
            </span>
          </Fragment>
        );
      })}
    </span>
  );
}
