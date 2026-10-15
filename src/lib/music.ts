/**
 * Background music of the invitation. Pure data: the player lives in src/lib/musicPlayer.ts and the
 * floating button in src/components/MusicButton.tsx.
 *
 * To add another song: put its files in public/musica/ (an Opus .webm and an AAC .m4a, prepared like
 * the first one: silence trimmed and loudness at about -16 LUFS so every song plays at the same level)
 * and add an entry below. The songs play in this order and the list starts over after the last one.
 */

export type Track = {
  title: string;
  artist: string;
  /** Same song in several formats; the browser plays the first one it supports. */
  sources: { src: string; type: string }[];
};

export const PLAYLIST: Track[] = [
  {
    title: "Tattoo",
    artist: "Brendan Ross (sax)",
    sources: [
      { src: "/musica/tattoo-sax.webm", type: 'audio/webm; codecs="opus"' },
      { src: "/musica/tattoo-sax.m4a", type: 'audio/mp4; codecs="mp4a.40.2"' },
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
