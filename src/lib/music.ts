/**
 * Background music of the invitation. Pure data: the player lives in src/lib/musicPlayer.ts and the
 * floating button in src/components/MusicButton.tsx.
 *
 * To add another song: put its files in public/musica/ (an AAC .m4a and an Opus .webm, prepared like
 * the first one: silence trimmed and loudness at about -16 LUFS so every song plays at the same level)
 * and add an entry below. The songs play in this order and the list starts over after the last one.
 *
 * Keep the AAC .m4a FIRST: Safari (every iPhone browser) plays WebM with an engine that bypasses Web
 * Audio, so the fades and the volume would be ignored. The .webm is only for browsers without AAC.
 */

export type Track = {
  title: string;
  artist: string;
  /** Same song in several formats; the browser plays the first one it supports (AAC first, see above). */
  sources: { src: string; type: string }[];
};

export const PLAYLIST: Track[] = [
  {
    title: "Tattoo",
    artist: "Brendan Ross (sax)",
    sources: [
      { src: "/musica/tattoo-sax.m4a", type: 'audio/mp4; codecs="mp4a.40.2"' },
      { src: "/musica/tattoo-sax.webm", type: 'audio/webm; codecs="opus"' },
    ],
  },
];

/** Times in seconds. */
export const MUSIC = {
  /** Playing volume (0–1); the files are already levelled, this keeps the music in the background. */
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
