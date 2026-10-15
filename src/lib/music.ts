/**
 * Background music of the invitation: shared types and timings. The songs themselves live in the
 * database (table `songs`) and are managed only from the admin panel ("Música"); the player is
 * src/lib/musicPlayer.ts and the floating button src/components/MusicButton.tsx.
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

export type PublicMusic = { tracks: PublicTrack[]; showTitle: boolean };

/** Type hints from the file name, so the browser can choose without downloading anything. */
export function audioType(url: string): string | undefined {
  const ext = url.split(/[?#]/)[0].split(".").pop()?.toLowerCase();
  if (ext === "m4a" || ext === "mp4" || ext === "aac") return 'audio/mp4; codecs="mp4a.40.2"';
  if (ext === "mp3") return "audio/mpeg";
  if (ext === "webm") return 'audio/webm; codecs="opus"';
  if (ext === "ogg" || ext === "oga") return "audio/ogg";
  if (ext === "wav") return "audio/wav";
  return undefined;
}

/** Times in seconds. */
export const MUSIC = {
  /** Playing volume (0–1), before each song's own correction: the music stays in the background. */
  volume: 0.75,
  /** When the envelope opens the music rises slowly from silence. */
  fadeInFirst: 12,
  /** Each song fades out over its last seconds… */
  fadeOutEnd: 8,
  /** …and the next one (or the same one again) comes in more briefly. */
  fadeInNext: 6,
  /** Pause / play from the button. */
  pauseFade: 1.2,
  resumeFade: 2.5,
};

/** Loudness every song is levelled to when it is uploaded (LUFS, approximately). */
export const TARGET_LOUDNESS = -16;
