"use client";

import { useEffect } from "react";

const STAR = "M12 0c.6 5.4 2.6 9.4 12 12-9.4 2.6-11.4 6.6-12 12-.6-5.4-2.6-9.4-12-12 9.4-2.6 11.4-6.6 12-12Z";
const COLORS = ["#fffbe8", "#F0CB65", "#D8C477", "#F6E7A8"];
/** At most this many bursts at the same time (fast taps don't pile up work). */
const MAX_LIVE = 3;
/** Where a tap should not throw sparks: typing, choosing, dialogs and the admin. */
const SKIP = "input, textarea, select, option, [contenteditable], [role=dialog], [data-no-sparkles]";

/**
 * A little magic wand: every tap or click on the invitation throws a burst of golden sparks from
 * that point. It never blocks anything (the sparks don't take pointer events), plays nothing with
 * reduced motion, skips form fields and is cleaned up after each burst. Renders nothing itself.
 */
export function TapSparkles() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let live = 0;

    const onClick = (e: MouseEvent) => {
      // detail 0 = "click" from the keyboard (Enter/Space): no position to sparkle from.
      if (reduce.matches || live >= MAX_LIVE || e.detail === 0) return;
      if (e.target instanceof Element && e.target.closest(SKIP)) return;

      live++;
      const layer = document.createElement("div");
      layer.setAttribute("aria-hidden", "true");
      layer.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;width:0;height:0;pointer-events:none;z-index:90`;
      const animations: Animation[] = [];

      // A soft ring of light where the finger touched.
      const ring = document.createElement("span");
      ring.style.cssText =
        "position:absolute;left:-14px;top:-14px;width:28px;height:28px;border-radius:9999px;border:1px solid rgba(240,203,101,.75);box-shadow:0 0 12px rgba(240,203,101,.45)";
      layer.appendChild(ring);
      animations.push(
        ring.animate(
          [
            { opacity: 0.9, transform: "scale(0.3)" },
            { opacity: 0, transform: "scale(1.6)" },
          ],
          { duration: 550, easing: "cubic-bezier(.2,.7,.3,1)", fill: "both" }
        )
      );

      const count = 8;
      const turn = Math.random() * Math.PI * 2;
      for (let i = 0; i < count; i++) {
        const angle = turn + (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
        const dist = 22 + Math.random() * 30;
        const size = i % 3 === 2 ? 4 : 7 + Math.random() * 7;
        const x = Math.cos(angle) * dist;
        const y = Math.sin(angle) * dist;
        const el = document.createElement("span");
        el.style.cssText = `position:absolute;left:${-size / 2}px;top:${-size / 2}px;width:${size}px;height:${size}px`;
        const color = COLORS[i % COLORS.length];
        if (size > 5) {
          el.innerHTML = `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="${color}" style="display:block;filter:drop-shadow(0 0 3px rgba(240,203,101,.7))"><path d="${STAR}"/></svg>`;
        } else {
          el.style.borderRadius = "9999px";
          el.style.background = color;
          el.style.boxShadow = "0 0 6px 1px rgba(240,203,101,.7)";
        }
        layer.appendChild(el);
        const spin = (Math.random() < 0.5 ? -1 : 1) * (90 + Math.random() * 120);
        animations.push(
          el.animate(
            [
              { opacity: 0, transform: "translate(0,0) scale(0.2) rotate(0deg)" },
              { opacity: 1, transform: `translate(${x * 0.6}px,${y * 0.6}px) scale(1) rotate(${spin * 0.5}deg)`, offset: 0.35 },
              // They drift down a little at the end, like falling glitter.
              { opacity: 0, transform: `translate(${x}px,${y + 14}px) scale(0.4) rotate(${spin}deg)` },
            ],
            { duration: 650 + Math.random() * 350, easing: "cubic-bezier(.2,.7,.35,1)", fill: "both" }
          )
        );
      }

      document.body.appendChild(layer);
      Promise.allSettled(animations.map((a) => a.finished)).then(() => {
        layer.remove();
        live--;
      });
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
