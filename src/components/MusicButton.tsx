"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Music, SkipForward } from "lucide-react";
import { PLAYLIST } from "@/lib/music";
import { getServerState, getState, nextTrack, subscribe, toggleMusic } from "@/lib/musicPlayer";

/** How long the song title stays visible next to the button. */
const ANNOUNCE_MS = 6000;

/**
 * Floating music button (bottom right), shown once the envelope has been opened. While the music plays
 * it shows little golden bars dancing; a tap pauses with a soft fade (and the choice is remembered),
 * another tap brings the music back. When a song starts its title appears next to the button for a few
 * seconds. With more than one song, a second button skips to the next one.
 */
export function MusicButton() {
  const s = useSyncExternalStore(subscribe, getState, getServerState);
  // The title shows for each new announcement until its time is up.
  const [shownUntil, setShownUntil] = useState(0);
  const showTitle = s.announce !== 0 && shownUntil !== s.announce;
  useEffect(() => {
    if (!s.announce) return;
    const id = setTimeout(() => setShownUntil(s.announce), ANNOUNCE_MS);
    return () => clearTimeout(id);
  }, [s.announce]);

  if (s.status === "idle") return null;
  const on = s.status === "playing" || s.status === "loading";
  const label = on ? "Pausar la música" : "Reproducir la música";

  return (
    <div
      className="fx-fade pointer-events-none fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-50 flex items-center gap-2 md:bottom-6 md:right-6"
    >
      <p
        className={`max-w-[60vw] truncate rounded-full border border-gold/30 bg-navy-deep/85 px-3.5 py-2 font-sans text-xs text-blue-ice shadow-lg backdrop-blur-sm transition-all duration-500 ${
          showTitle ? "translate-x-0 opacity-100" : "pointer-events-none translate-x-3 opacity-0"
        }`}
        aria-hidden="true"
      >
        {on ? (
          <>
            <span className="text-gold">♪</span> {s.track.title} · <span className="text-blue-mist">{s.track.artist}</span>
          </>
        ) : (
          "Toca para oír la música"
        )}
      </p>

      {/* For screen readers: the title is announced when it appears. */}
      <span className="sr-only" aria-live="polite">
        {showTitle && on ? `${s.track.title}, ${s.track.artist}` : ""}
      </span>

      {PLAYLIST.length > 1 && on && (
        <button
          type="button"
          onClick={() => nextTrack()}
          className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 bg-navy-deep/85 text-gold shadow-lg backdrop-blur-sm transition-colors hover:bg-gold hover:text-navy"
          aria-label="Siguiente canción"
          title="Siguiente canción"
        >
          <SkipForward size={17} strokeWidth={1.6} />
        </button>
      )}

      <button
        type="button"
        onClick={() => toggleMusic()}
        className="pointer-events-auto relative flex h-12 w-12 items-center justify-center rounded-full border border-gold/60 bg-navy-deep/85 text-gold shadow-[0_6px_24px_-6px_rgba(0,0,0,0.6),0_0_22px_-6px_rgba(216,196,119,0.5)] backdrop-blur-sm transition-transform hover:scale-105 active:scale-95"
        aria-label={label}
        title={label}
      >
        <span className="absolute inset-[3px] rounded-full border border-gold/20" aria-hidden="true" />
        {on ? (
          // Golden equalizer: four bars that dance while the music plays.
          <span className="flex h-4 items-end gap-[3px]" aria-hidden="true">
            {[0.9, 0.55, 1, 0.7].map((h, i) => (
              <span
                key={i}
                className={`eq-bar block w-[3px] rounded-full bg-gold ${s.status === "loading" ? "opacity-60" : ""}`}
                style={{ height: `${h * 100}%`, animationDelay: `${i * -0.27}s` }}
              />
            ))}
          </span>
        ) : (
          <Music size={18} strokeWidth={1.6} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
