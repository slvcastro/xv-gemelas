import { cache } from "react";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { settings, songs } from "@/db/schema";
import { DEFAULT_MUSIC_SETTINGS, audioType, cleanMusicSettings, type PublicMusic } from "@/lib/music";

/** The song bundled with the site, used only if the database can't be read. No name: it is never shown. */
const FALLBACK: PublicMusic = {
  tracks: [
    {
      sources: [
        { src: "/musica/fondo-1.m4a", type: audioType("/musica/fondo-1.m4a") },
        { src: "/musica/fondo-1.webm", type: audioType("/musica/fondo-1.webm") },
      ],
      gain: 1,
      startAt: 0,
      endAt: null,
    },
  ],
  showTitle: false,
  settings: DEFAULT_MUSIC_SETTINGS,
};

/**
 * Music for the public invitation: active songs in order and whether their names may be shown.
 * Names are only included when the admin turned that on, so they never reach the page otherwise.
 * Never throws (wrapped in `cache`: one query per request).
 */
export const getPublicMusic = cache(async (): Promise<PublicMusic> => {
  try {
    const [rows, [setting]] = await Promise.all([
      db
        .select({
          title: songs.title,
          artist: songs.artist,
          url: songs.url,
          altUrl: songs.altUrl,
          gain: songs.gain,
          startAt: songs.startAt,
          endAt: songs.endAt,
        })
        .from(songs)
        .where(eq(songs.isActive, true))
        .orderBy(asc(songs.sortOrder), asc(songs.createdAt)),
      db
        .select({
          showSongTitle: settings.showSongTitle,
          volume: settings.musicVolume,
          fadeIn: settings.musicFadeIn,
          crossfade: settings.musicCrossfade,
        })
        .from(settings)
        .orderBy(asc(settings.id))
        .limit(1),
    ]);
    const showTitle = setting?.showSongTitle ?? false;
    return {
      showTitle,
      settings: cleanMusicSettings(setting),
      tracks: rows.map((r) => ({
        sources: [r.url, r.altUrl].filter((u): u is string => !!u).map((src) => ({ src, type: audioType(src) })),
        gain: r.gain,
        startAt: r.startAt,
        endAt: r.endAt,
        ...(showTitle && { title: r.title, ...(r.artist && { artist: r.artist }) }),
      })),
    };
  } catch (error) {
    console.error("Error al leer la música:", error);
    return FALLBACK;
  }
});
