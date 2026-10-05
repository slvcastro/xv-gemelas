"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Eye, EyeOff, ImagePlus, Star, Trash2 } from "lucide-react";
import { deleteMedia, registerMedia, updateMedia } from "@/app/actions/media";
import { ConfirmDialog, btnPrimary, btnSmall, inputCls, labelCls } from "./ui";
import { MEDIA_USAGE_LABELS, type AdminMedia, type MediaUsage } from "./types";

const USAGE_OPTIONS = Object.entries(MEDIA_USAGE_LABELS) as [MediaUsage, string][];
const SINGLE_USE: MediaUsage[] = ["cover_both", "portrait_kelly", "portrait_kyara", "share_preview"];
const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

async function readDimensions(file: File) {
  try {
    const bitmap = await createImageBitmap(file);
    const dims = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return dims;
  } catch {
    return {};
  }
}

export function PhotosPanel({ media, notify }: { media: AdminMedia[]; notify: (message: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [usage, setUsage] = useState<MediaUsage>("gallery");
  const [progress, setProgress] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AdminMedia | null>(null);

  // Media arrives newest first: for single-use slots the newest published photo is the one shown.
  const inUse = new Set<string>();
  for (const slot of SINGLE_USE) {
    const current = media.find((m) => m.usage === slot && m.isPublished);
    if (current) inUse.add(current.id);
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const files = Array.from(fileRef.current?.files ?? []);
    if (files.length === 0) {
      notify("Elige al menos una foto.");
      return;
    }
    const { upload } = await import("@vercel/blob/client");
    let ok = 0;
    for (const [i, file] of files.entries()) {
      const label = files.length > 1 ? `Foto ${i + 1} de ${files.length}` : "Foto";
      try {
        setProgress(`${label}: subiendo…`);
        const dims = await readDimensions(file);
        const safeName = file.name.normalize("NFD").replace(/[^\w.-]+/g, "-").toLowerCase();
        const blob = await upload(`xv/${safeName}`, file, {
          access: "public",
          handleUploadUrl: "/api/upload",
          multipart: file.size > 8 * 1024 * 1024,
          onUploadProgress: ({ percentage }) => setProgress(`${label}: ${Math.round(percentage)}%`),
        });
        const result = await registerMedia({ url: blob.url, usage, ...dims });
        if (!result.success) throw new Error(result.error);
        ok++;
      } catch (err) {
        console.error(err);
        const reason = err instanceof Error ? err.message : "";
        notify(
          /client token/i.test(reason)
            ? "No se pudo autorizar la subida. Verifica que Vercel Blob esté conectado al proyecto (variable BLOB_READ_WRITE_TOKEN) y que sigas con la sesión iniciada."
            : `No se pudo subir «${file.name}». ${reason}`
        );
      }
    }
    setProgress(null);
    if (fileRef.current) fileRef.current.value = "";
    if (ok > 0) notify(ok === 1 ? "Foto subida y publicada." : `${ok} fotos subidas y publicadas.`);
  };

  const change = async (item: AdminMedia, data: Parameters<typeof updateMedia>[1], message?: string) => {
    setPendingId(item.id);
    const result = await updateMedia(item.id, data);
    setPendingId(null);
    notify(result.success ? (message ?? "Foto actualizada.") : result.error ?? "Error");
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setPendingId(deleting.id);
    const result = await deleteMedia(deleting.id);
    setPendingId(null);
    setDeleting(null);
    notify(result.success ? "Foto eliminada." : result.error ?? "Error");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-gold">Fotografías</h1>
        <p className="mt-1 font-sans text-sm text-blue-mist">
          Las fotos publicadas aparecen en la invitación según su uso. Toca una foto para elegir el punto que debe quedar centrado.
        </p>
      </div>

      <form onSubmit={handleUpload} className="grid gap-4 border border-dashed border-gold/35 bg-blue-dark/30 p-5 md:grid-cols-[1fr_220px_auto] md:items-end">
        <div>
          <label htmlFor="photo-files" className={labelCls}>Fotos (JPG, PNG, WebP)</label>
          <input
            id="photo-files"
            ref={fileRef}
            type="file"
            accept={ACCEPT}
            multiple
            className="block w-full font-sans text-sm text-blue-ice file:mr-3 file:border-0 file:bg-gold/15 file:px-3 file:py-2 file:font-sans file:text-xs file:uppercase file:tracking-[0.15em] file:text-gold"
          />
        </div>
        <div>
          <label htmlFor="photo-usage" className={labelCls}>Usar como</label>
          <select id="photo-usage" value={usage} onChange={(e) => setUsage(e.target.value as MediaUsage)} className={inputCls}>
            {USAGE_OPTIONS.filter(([v]) => v !== "none").map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={progress !== null} className={btnPrimary}>
          <ImagePlus size={15} /> {progress ?? "Subir"}
        </button>
      </form>

      {media.length === 0 ? (
        <p className="border border-dashed border-gold/20 px-6 py-12 text-center font-sans text-sm text-blue-mist">
          Aún no hay fotos. Sube la portada y las fotos de la galería.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {media.map((item) => (
            <li key={item.id} className={`flex flex-col border bg-blue-dark/40 ${inUse.has(item.id) ? "border-gold/70" : "border-gold/20"} ${pendingId === item.id ? "opacity-60" : ""}`}>
              <button
                type="button"
                className="relative aspect-[3/4] w-full cursor-crosshair overflow-hidden"
                aria-label="Elegir punto focal"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const focalX = ((e.clientX - rect.left) / rect.width) * 100;
                  const focalY = ((e.clientY - rect.top) / rect.height) * 100;
                  change(item, { focalX, focalY }, "Punto focal guardado.");
                }}
              >
                <Image
                  src={item.url}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                  className={`object-cover ${item.isPublished ? "" : "grayscale"}`}
                  style={{ objectPosition: `${item.focalX}% ${item.focalY}%` }}
                />
                <span
                  className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-gold/70 shadow"
                  style={{ left: `${item.focalX}%`, top: `${item.focalY}%` }}
                />
                {inUse.has(item.id) && (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 bg-navy/85 px-2 py-0.5 font-sans text-[10px] uppercase tracking-[0.15em] text-gold">
                    <Star size={10} /> En uso
                  </span>
                )}
                {!item.isPublished && (
                  <span className="absolute inset-x-0 bottom-0 bg-navy/85 py-1 text-center font-sans text-[10px] uppercase tracking-[0.2em] text-blue-mist">
                    Oculta
                  </span>
                )}
              </button>
              <div className="flex flex-1 flex-col gap-2 p-3">
                <select
                  aria-label="Uso de la foto"
                  value={item.usage}
                  disabled={pendingId === item.id}
                  onChange={(e) => change(item, { usage: e.target.value }, `Ahora es: ${MEDIA_USAGE_LABELS[e.target.value as MediaUsage]}.`)}
                  className={`${inputCls} py-2 text-xs`}
                >
                  {USAGE_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <div className="mt-auto flex gap-2">
                  <button
                    type="button"
                    disabled={pendingId === item.id}
                    onClick={() => change(item, { isPublished: !item.isPublished }, item.isPublished ? "Foto ocultada." : "Foto publicada.")}
                    className={`${btnSmall} flex-1 justify-center px-2`}
                  >
                    {item.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                    {item.isPublished ? "Ocultar" : "Publicar"}
                  </button>
                  <button
                    type="button"
                    disabled={pendingId === item.id}
                    onClick={() => setDeleting(item)}
                    className={`${btnSmall} px-2 hover:!border-red-300/60 hover:!text-red-200`}
                    aria-label="Eliminar foto"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {deleting && (
        <ConfirmDialog
          title="Eliminar foto"
          confirmLabel="Sí, eliminar"
          busy={pendingId === deleting.id}
          onConfirm={handleDelete}
          onClose={() => setDeleting(null)}
          message="La foto se borrará del almacenamiento y dejará de aparecer en la invitación. Esta acción no se puede deshacer."
        />
      )}
    </div>
  );
}
