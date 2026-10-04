"use client";

import { useSyncExternalStore } from "react";

// 28 nov 2026, 7:30 p. m. hora de Yucatán (UTC-6 todo el año)
const TARGET = new Date("2026-11-28T19:30:00-06:00").getTime();
const UNITS = ["días", "horas", "minutos", "segundos"] as const;

function subscribe(onTick: () => void) {
  const id = setInterval(onTick, 1000);
  return () => clearInterval(id);
}
// Whole seconds, so the snapshot is stable between ticks.
const getNow = () => Math.floor(Date.now() / 1000) * 1000;
// No clock on the server / during hydration: render placeholders instead of a mismatched time.
const getServerNow = () => null;

function remaining(now: number) {
  const diff = Math.max(0, TARGET - now);
  return {
    días: Math.floor(diff / 86_400_000),
    horas: Math.floor((diff % 86_400_000) / 3_600_000),
    minutos: Math.floor((diff % 3_600_000) / 60_000),
    segundos: Math.floor((diff % 60_000) / 1000),
    done: diff === 0,
  };
}

export const CountdownSection = () => {
  const now = useSyncExternalStore(subscribe, getNow, getServerNow);
  const left = now === null ? null : remaining(now);

  return (
    <section className="relative w-full overflow-hidden border-y border-gold/20 bg-blue-dark/60 px-4 py-16 sm:px-6">
      <div className="absolute inset-0 gold-dust opacity-40" aria-hidden="true" />
      <p className="relative mb-8 text-center font-sans text-[11px] uppercase tracking-[0.4em] text-blue-mist">
        {left?.done ? "¡Hoy es el gran día!" : "Ya falta muy poco"}
      </p>
      <div className="relative mx-auto grid max-w-md grid-cols-4 gap-2 sm:gap-3 md:max-w-lg md:gap-5" role="timer" aria-live="off">
        {UNITS.map((u) => (
          <div key={u} className="card-gold flex flex-col items-center py-4">
            <span className="font-serif text-3xl tabular-nums text-gold md:text-5xl">
              {left ? String(left[u]).padStart(2, "0") : "--"}
            </span>
            <span className="mt-2 font-sans text-[9px] uppercase tracking-[0.1em] text-blue-mist sm:text-[10px] sm:tracking-[0.2em]">{u}</span>
          </div>
        ))}
      </div>
    </section>
  );
};
