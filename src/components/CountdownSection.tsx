"use client";

import { useEffect, useState } from "react";

// 28 nov 2026, 7:30 p. m. hora de Yucatán (UTC-6 todo el año)
const TARGET = new Date("2026-11-28T19:30:00-06:00").getTime();

function getRemaining() {
  const diff = Math.max(0, TARGET - Date.now());
  return {
    días: Math.floor(diff / 86_400_000),
    horas: Math.floor((diff % 86_400_000) / 3_600_000),
    minutos: Math.floor((diff % 3_600_000) / 60_000),
    segundos: Math.floor((diff % 60_000) / 1000),
    done: diff === 0,
  };
}

export const CountdownSection = () => {
  // null on the server / first paint to avoid hydration mismatches
  const [left, setLeft] = useState<ReturnType<typeof getRemaining> | null>(null);

  useEffect(() => {
    setLeft(getRemaining());
    const id = setInterval(() => setLeft(getRemaining()), 1000);
    return () => clearInterval(id);
  }, []);

  const units = left ? (["días", "horas", "minutos", "segundos"] as const) : [];

  return (
    <section className="relative w-full overflow-hidden border-y border-gold/20 bg-blue-dark/60 px-6 py-16">
      <div className="absolute inset-0 gold-dust opacity-40" aria-hidden="true" />
      <p className="relative mb-8 text-center font-sans text-[11px] uppercase tracking-[0.4em] text-blue-mist">
        {left?.done ? "¡Hoy es el gran día!" : "Ya falta muy poco"}
      </p>
      <div className="relative mx-auto flex max-w-xl justify-center gap-3 md:gap-6">
        {left === null
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 w-20 card-gold md:w-24" />)
          : units.map((u) => (
              <div key={u} className="card-gold flex w-20 flex-col items-center py-4 md:w-24">
                <span className="font-serif text-3xl tabular-nums text-gold md:text-5xl">
                  {String(left[u]).padStart(2, "0")}
                </span>
                <span className="mt-2 font-sans text-[10px] uppercase tracking-[0.2em] text-blue-mist">{u}</span>
              </div>
            ))}
      </div>
    </section>
  );
};
