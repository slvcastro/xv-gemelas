"use client";

import { useEffect, useRef } from "react";

// One observer for the whole page. When an element enters the viewport it gets `data-inview`
// and is no longer observed; CSS (globals.css, `.fx-inview`) un-pauses its entrance animations.
let observer: IntersectionObserver | null = null;
function getObserver() {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        (e.target as HTMLElement).dataset.inview = "";
        observer?.unobserve(e.target);
      }
    },
    { rootMargin: "0px 0px -12% 0px" }
  );
  return observer;
}

/**
 * Scope for scroll-triggered CSS animations: everything inside with an `fx-*` animation waits
 * (paused at its first frame) until this block scrolls into view. Children stay server-rendered.
 */
export function InView({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.dataset.inview = "";
      return;
    }
    const o = getObserver();
    o.observe(el);
    return () => o.unobserve(el);
  }, []);
  return (
    <div ref={ref} className={`fx-inview ${className}`}>
      {children}
    </div>
  );
}
