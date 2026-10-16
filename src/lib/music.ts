/**
 * Background music of the invitation: shared types and timings. The songs and the sound settings live in
 * the database (table `songs`, settings row) and are managed only from the admin panel ("Música"); the
 * player is src/lib/musicPlayer.ts and the floating button src/components/MusicButton.tsx.
 */

/** What a guest's browser receives for each song. `title`/`artist` only when the admin shows them. */
export type PublicTrack = {
  /** Same song in one or two formats; the browser plays the first one it supports. */
  sources: { src: string; type?: string }[];
  /** Volume correction worked out on upload (1 = as recorded). */
  gain: number;
  /** Seconds of silence skipped at the start, and where the music ends (null = end of the file). */
  startAt: number;
  endAt: number | null;
  title?: string;
  artist?: string;
};

/** Sound settings chosen in the admin panel. */
export type MusicSettings = {
  /** Maximum volume, 0–1 (0.7 = 70 %). */
  volume: number;
  /** Seconds the music takes to rise when the envelope is opened (0 = starts right away). */
  fadeIn: number;
  /** Seconds one song blends into the next (and into itself when the list starts over); 0 = no blend. */
  crossfade: number;
};

export const DEFAULT_MUSIC_SETTINGS: MusicSettings = { volume: 0.7, fadeIn: 0, crossfade: 6 };

/** Limits for each setting (the panel's sliders and the server both use them). */
export const MUSIC_LIMITS = {
  volume: { min: 0.1, max: 1 },
  fadeIn: { min: 0, max: 15 },
  crossfade: { min: 0, max: 12 },
};

const clamp = (v: unknown, lo: number, hi: number, fallback: number) =>
  typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback;

/** Settings within their limits (bad or missing values become the defaults). */
export function cleanMusicSettings(s: Partial<MusicSettings> | null | undefined): MusicSettings {
  const d = DEFAULT_MUSIC_SETTINGS;
  const l = MUSIC_LIMITS;
  return {
    volume: clamp(s?.volume, l.volume.min, l.volume.max, d.volume),
    fadeIn: clamp(s?.fadeIn, l.fadeIn.min, l.fadeIn.max, d.fadeIn),
    crossfade: clamp(s?.crossfade, l.crossfade.min, l.crossfade.max, d.crossfade),
  };
}

export type PublicMusic = { tracks: PublicTrack[]; showTitle: boolean; settings: MusicSettings };

/** Type hints from the file name, so the browser can choose without downloading anything. */
export function audioType(url: string): string | undefined {
  const ext = url.split(/[?#]/)[0].split(".").pop()?.toLowerCase();
  if (ext === "m4a" || ext === "mp4") return 'audio/mp4; codecs="mp4a.40.2"';
  if (ext === "aac") return "audio/aac";
  if (ext === "mp3") return "audio/mpeg";
  if (ext === "webm") return 'audio/webm; codecs="opus"';
  if (ext === "ogg" || ext === "oga") return "audio/ogg";
  if (ext === "wav") return "audio/wav";
  return undefined;
}

/** Fixed timings in seconds (the rest are in MusicSettings). */
export const MUSIC = {
  /** Pause / play from the button: short, so the button answers at once. */
  pauseFade: 0.8,
  resumeFade: 1,
  /** "Siguiente canción": a quick blend, never longer than this. */
  skipFade: 2,
  /** Shortest change of volume, so starts and stops never click. */
  minFade: 0.08,
  /** The next song starts loading this long before it is needed. */
  preload: 15,
};

/** Loudness every song is levelled to when it is uploaded (LUFS, approximately). */
export const TARGET_LOUDNESS = -16;
