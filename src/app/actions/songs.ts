"use server";

import { del } from "@vercel/blob";
import { asc, eq, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { settings, songs } from "@/db/schema";
import { CEREMONY_STARTS_AT, RECEPTION_STARTS_AT } from "@/lib/event";
import { requireAdmin } from "./adminAuth";

type Result = { success: true } | { success: false; error: string };

const BLOB_URL = /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const finite = (v: unknown, fallback: number) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);

function refresh() {
  revalidatePath("/", "layout");
}

/**
 * Saves a song already uploaded from the admin's browser to Vercel Blob. `gain`, `startAt` and `endAt`
 * come from the analysis the browser did before uploading (levelled volume, silences at the ends).
 */
export async function addSong(input: {
  url: string;
  title: string;
  artist?: string;
  gain: number;
  startAt: number;
  endAt: number | null;
  duration: number | null;
}): Promise<Result> {
  await requireAdmin();
  try {
    if (!BLOB_URL.test(input.url)) return { success: false, error: "Archivo de audio inválido." };
    const duration = input.duration && input.duration > 0 ? input.duration : null;
    const startAt = clamp(finite(input.startAt, 0), 0, 60);
    let endAt: number | null = input.endAt == null ? null : finite(input.endAt, 0);
    if (endAt !== null && (endAt <= startAt + 5 || (duration && endAt > duration))) endAt = null;
    const [{ last }] = await db.select({ last: max(songs.sortOrder) }).from(songs);
    await db.insert(songs).values({
      url: input.url,
      title: input.title.trim().slice(0, 120) || "Canción",
      artist: input.artist?.trim().slice(0, 120) || null,
      gain: clamp(finite(input.gain, 1), 0.05, 4),
      startAt,
      endAt,
      duration,
      sortOrder: (last ?? -1) + 1,
    });
    refresh();
    return { success: true };
  } catch (error) {
    console.error("Error al guardar la canción:", error);
    return { success: false, error: "No se pudo guardar la canción." };
  }
}

export async function updateSong(id: string, data: { title?: string; artist?: string; isActive?: boolean }): Promise<Result> {
  await requireAdmin();
  try {
    const title = data.title?.trim().slice(0, 120);
    if (data.title !== undefined && !title) return { success: false, error: "Escribe el nombre de la canción." };
    await db
      .update(songs)
      .set({
        ...(title && { title }),
        ...(data.artist !== undefined && { artist: data.artist.trim().slice(0, 120) || null }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      })
      .where(eq(songs.id, id));
    refresh();
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar la canción:", error);
    return { success: false, error: "No se pudo guardar el cambio." };
  }
}

/** Moves a song one place up (-1) or down (1) in the playing order. */
export async function moveSong(id: string, direction: -1 | 1): Promise<Result> {
  await requireAdmin();
  try {
    const list = await db.select({ id: songs.id }).from(songs).orderBy(asc(songs.sortOrder), asc(songs.createdAt));
    const i = list.findIndex((s) => s.id === id);
    const j = i + direction;
    if (i < 0 || j < 0 || j >= list.length) return { success: true };
    [list[i], list[j]] = [list[j], list[i]];
    // Renumber the whole list (0, 1, 2…) so the order never has ties.
    await Promise.all(list.map((s, k) => db.update(songs).set({ sortOrder: k }).where(eq(songs.id, s.id))));
    refresh();
    return { success: true };
  } catch (error) {
    console.error("Error al mover la canción:", error);
    return { success: false, error: "No se pudo cambiar el orden." };
  }
}

export async function deleteSong(id: string): Promise<Result> {
  await requireAdmin();
  try {
    const [song] = await db.select({ url: songs.url, altUrl: songs.altUrl }).from(songs).where(eq(songs.id, id));
    if (song) {
      // Files uploaded from the panel live in Blob; the first song ships with the site and stays there.
      for (const url of [song.url, song.altUrl]) {
        if (url && BLOB_URL.test(url)) {
          try {
            await del(url);
          } catch (e) {
            console.warn("No se pudo borrar del Blob (se borra de la base igualmente):", e);
          }
        }
      }
      await db.delete(songs).where(eq(songs.id, id));
    }
    refresh();
    return { success: true };
  } catch (error) {
    console.error("Error al borrar la canción:", error);
    return { success: false, error: "No se pudo borrar la canción." };
  }
}

/** Whether guests see the song's name (off by default: they only see the music button). */
export async function setShowSongTitle(on: boolean): Promise<Result> {
  await requireAdmin();
  try {
    const [row] = await db.select({ id: settings.id }).from(settings).orderBy(asc(settings.id)).limit(1);
    if (row) {
      await db.update(settings).set({ showSongTitle: on, updatedAt: new Date() }).where(eq(settings.id, row.id));
    } else {
      await db.insert(settings).values({ eventDate: CEREMONY_STARTS_AT, receptionDate: RECEPTION_STARTS_AT, showSongTitle: on });
    }
    refresh();
    return { success: true };
  } catch (error) {
    console.error("Error al guardar la opción del nombre:", error);
    return { success: false, error: "No se pudo guardar la opción." };
  }
}
