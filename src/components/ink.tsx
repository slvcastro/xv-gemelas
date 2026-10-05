import { Fragment } from "react";

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
  let t = start;
  return (
    <span className={className}>
      {words.map((w, i) => {
        const dur = (write * w.length) / chars;
        const style = { "--d": `${Math.round(t * 1000) / 1000}s`, "--t": `${Math.round(dur * 1000) / 1000}s` } as React.CSSProperties;
        t += dur + gap;
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
