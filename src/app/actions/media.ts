"use server";

import { del } from "@vercel/blob";
import { db } from "@/db";
import { media } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "./adminAuth";

type Usage = "cover_both" | "portrait_kelly" | "portrait_kyara" | "gallery" | "share_preview" | "none";
const USAGES: Usage[] = ["cover_both", "portrait_kelly", "portrait_kyara", "gallery", "share_preview", "none"];

function refresh() {
  revalidatePath("/", "layout");
}

/**
 * Saves a photo that was already uploaded directly from the browser to Vercel Blob.
 * (Direct browser upload avoids the 1 MB server-action limit and Vercel's 4.5 MB body limit.)
 */
export async function registerMedia(input: { url: string; usage: string; width?: number; height?: number; altText?: string }) {
  await requireAdmin();
  try {
    if (!/^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i.test(input.url)) {
      return { success: false, error: "URL de imagen inválida." };
    }
    const usage = (USAGES.includes(input.usage as Usage) ? input.usage : "gallery") as Usage;

    await db.insert(media).values({
      url: input.url,
      publicId: input.url,
      width: input.width ?? null,
      height: input.height ?? null,
      altText: input.altText || "Kelly y Kyara",
      usage,
      isPublished: true,
    });
    refresh();
    return { success: true };
  } catch (error) {
    console.error("Error al registrar imagen:", error);
    return { success: false, error: "No se pudo guardar la foto." };
  }
}

export async function updateMedia(id: string, data: { usage?: string; focalX?: number; focalY?: number; isPublished?: boolean }) {
  await requireAdmin();
  try {
    await db
      .update(media)
      .set({
        ...(data.usage && USAGES.includes(data.usage as Usage) && { usage: data.usage as Usage }),
        ...(data.focalX !== undefined && { focalX: String(Math.round(data.focalX)) }),
        ...(data.focalY !== undefined && { focalY: String(Math.round(data.focalY)) }),
        ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
      })
      .where(eq(media.id, id));
    refresh();
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar imagen:", error);
    return { success: false, error: "No se pudo actualizar la foto." };
  }
}

export async function deleteMedia(id: string) {
  await requireAdmin();
  try {
    const [item] = await db.select().from(media).where(eq(media.id, id));
    if (item) {
      try {
        await del(item.url);
      } catch (e) {
        console.warn("No se pudo borrar del Blob (se borra de la base igualmente):", e);
      }
      await db.delete(media).where(eq(media.id, id));
    }
    refresh();
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar imagen:", error);
    return { success: false, error: "No se pudo eliminar la foto." };
  }
}
