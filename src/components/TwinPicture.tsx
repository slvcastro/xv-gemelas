"use client";

import { useEffect, useState } from "react";

/**
 * Resolves once the page has finished loading or the guest first touches the screen (whichever comes
 * first). The twins' photos wait for it: they sit under the envelope, so fetching them while the page
 * loads would only compete with the envelope itself. A tap on "Abrir invitación" leaves them more than
 * a second before they start to appear.
 */
let ready: Promise<void> | null = null;
function pageReady() {
  ready ??= new Promise<void>((resolve) => {
    if (document.readyState === "complete") return resolve();
    const go = () => resolve();
    window.addEventListener("load", go, { once: true });
    window.addEventListener("pointerdown", go, { once: true, capture: true });
    window.addEventListener("keydown", go, { once: true, capture: true });
  });
  return ready;
}

const SIZES =
  "(max-height: 520px) 10rem, (min-width: 768px) and (min-height: 940px) 17.5rem, (min-width: 768px) 15rem, min(calc((100vw - 4rem) / 1.83), 13rem)";

/**
 * One of the twins' cut-outs (static, pre-optimised AVIF with a WebP fallback, 420 and 600 px wide:
 * no Image Optimization quota is used). The sources are set once `pageReady()` resolves.
 */
export function TwinPicture({ file, alt, className, style }: { file: string; alt: string; className: string; style?: React.CSSProperties }) {
  const [load, setLoad] = useState(false);
  useEffect(() => {
    let live = true;
    pageReady().then(() => live && setLoad(true));
    return () => {
      live = false;
    };
  }, []);

  const set = (ext: string) => `/fotos/${file}-420.${ext} 420w, /fotos/${file}.${ext} 600w`;
  return (
    <picture>
      {load && <source type="image/avif" srcSet={set("avif")} sizes={SIZES} />}
      <img
        src={load ? `/fotos/${file}.webp` : undefined}
        srcSet={load ? set("webp") : undefined}
        sizes={load ? SIZES : undefined}
        // Without a source yet, an alt text would be drawn in its place.
        alt={load ? alt : ""}
        width={600}
        height={737}
        decoding="async"
        className={`absolute inset-0 h-full w-full select-none ${className}`}
        style={style}
        draggable={false}
      />
    </picture>
  );
}
