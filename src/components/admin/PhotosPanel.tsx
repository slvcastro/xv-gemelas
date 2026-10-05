"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Eye, EyeOff, ImagePlus, Images, RefreshCw, Trash2, Undo2 } from "lucide-react";
import { deleteMedia, registerMedia, updateMedia } from "@/app/actions/media";
import { ConfirmDialog, btnPrimary, btnSmall, inputCls } from "./ui";
import { MEDIA_USAGE_LABELS, type AdminMedia, type MediaUsage } from "./types";

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

/** Photos with a fixed place in the invitation: one each. The newest published one is shown. */
const SLOTS: { usage: MediaUsage; title: string; where: string; tip: string; aspect: string }[] = [
  {
    usage: "cover_both",
    title: "Portada",
    where: "En el arco dorado de la primera pantalla, debajo de los nombres.",
    tip: "Las dos juntas, foto vertical.",
    aspect: "aspect-[3/4]",
  },
  {
    usage: "portrait_kelly",
    title: "Kelly",
    where: "Retrato de Kelly al inicio de la galería.",
    tip: "Kelly sola, foto vertical.",
    aspect: "aspect-[3/4]",
  },
  {
    usage: "portrait_kyara",
    title: "Kyara",
    where: "Retrato de Kyara al inicio de la galería.",
    tip: "Kyara sola, foto vertical.",
    aspect: "aspect-[3/4]",
  },
  {
    usage: "share_preview",
    title: "Vista previa en WhatsApp",
    where: "La imagen que aparece al mandar el enlace por WhatsApp.",
    tip: "Opcional: si no subes una, se usa la portada.",
    aspect: "aspect-[3/4]",
  },
];

const REASSIGN_OPTIONS = (Object.entries(MEDIA_USAGE_LABELS) as [MediaUsage, string][]).filter(([v]) => v !== "none");

/**
 * Phone photos are often 4–12 MB. Shrink them in the browser to at most 2400 px on the long side
 * before uploading: they still look sharp on any screen and use a fraction of the free Blob storage
 * and transfer. Returns the original file when it is already small or the browser can't decode it.
 */
const MAX_SIDE = 2400;
async function prepareImage(file: File): Promise<{ file: File; width?: number; height?: number }> {
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
    if (scale === 1 && file.size <= 2.5 * 1024 * 1024) {
      bitmap.close();
      return { file, width, height };
    }
    const w = Math.round(width * scale);
    const h = Math.round(height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return { file, width, height };
    }
    ctx.fillStyle = "#05214B"; // transparent PNGs get the invitation's navy instead of black
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.86));
    if (!blob || blob.size >= file.size) return { file, width, height };
    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return { file: new File([blob], name, { type: "image/jpeg" }), width: w, height: h };
  } catch {
    return { file };
  }
}

export function PhotosPanel({ media, notify }: { media: AdminMedia[]; notify: (message: string) => void }) {
  const singleRef = useRef<HTMLInputElement>(null);
  const multiRef = useRef<HTMLInputElement>(null);
  // Which slot the single-file picker is filling (a ref, so it is set before the picker opens).
  const targetRef = useRef<{ usage: MediaUsage; replacing?: AdminMedia } | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AdminMedia | null>(null);

  // Media arrives newest first, so the first published match is the photo shown in each slot.
  const slotPhoto = (usage: MediaUsage) => media.find((m) => m.usage === usage && m.isPublished) ?? null;
  const shownIds = new Set(SLOTS.map((s) => slotPhoto(s.usage)?.id).filter(Boolean));
  const gallery = media.filter((m) => m.usage === "gallery");
  const unused = media.filter((m) => m.usage !== "gallery" && !shownIds.has(m.id));
  const busy = progress !== null;

  const uploadFiles = async (files: File[], usage: MediaUsage, replacing?: AdminMedia) => {
    if (files.length === 0) return;
    const { upload } = await import("@vercel/blob/client");
    let ok = 0;
    for (const [i, original] of files.entries()) {
      const label = files.length > 1 ? `Foto ${i + 1} de ${files.length}` : "Foto";
      try {
        setProgress(`${label}: preparando…`);
        const { file, width, height } = await prepareImage(original);
        const safeName = file.name.normalize("NFD").replace(/[^\w.-]+/g, "-").toLowerCase();
        setProgress(`${label}: subiendo…`);
        const blob = await upload(`xv/${safeName}`, file, {
          access: "public",
          handleUploadUrl: "/api/upload",
          multipart: file.size > 8 * 1024 * 1024,
          onUploadProgress: ({ percentage }) => setProgress(`${label}: ${Math.round(percentage)}%`),
        });
        const result = await registerMedia({ url: blob.url, usage, width, height });
        if (!result.success) throw new Error(result.error);
        ok++;
      } catch (err) {
        console.error(err);
        const reason = err instanceof Error ? err.message : "";
        notify(
          /client token/i.test(reason)
            ? "No se pudo autorizar la subida. Verifica que Vercel Blob esté conectado al proyecto (variable BLOB_READ_WRITE_TOKEN) y que sigas con la sesión iniciada."
            : `No se pudo subir «${original.name}». ${reason}`
        );
      }
    }
    // The replaced photo stays in "Otras fotos" (unused) so it can be restored or deleted.
    if (ok > 0 && replacing) await updateMedia(replacing.id, { usage: "none" });
    setProgress(null);
    if (ok > 0) {
      notify(
        usage === "gallery"
          ? ok === 1
            ? "Foto agregada a la galería."
            : `${ok} fotos agregadas a la galería.`
          : `Listo: ${MEDIA_USAGE_LABELS[usage]} actualizada.`
      );
    }
  };

  const pickFor = (usage: MediaUsage, replacing?: AdminMedia) => {
    targetRef.current = { usage, replacing };
    singleRef.current?.click();
  };

  const change = async (item: AdminMedia, data: Parameters<typeof updateMedia>[1], message?: string) => {
    setPendingId(item.id);
    const result = await updateMedia(item.id, data);
    setPendingId(null);
    notify(result.success ? (message ?? "Foto actualizada.") : result.error ?? "Error");
  };

  const setFocal = (item: AdminMedia) => (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const focalX = ((e.clientX - rect.left) / rect.width) * 100;
    const focalY = ((e.clientY - rect.top) / rect.height) * 100;
    change(item, { focalX, focalY }, "Listo: esa parte de la foto quedará al centro.");
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setPendingId(deleting.id);
    const result = await deleteMedia(deleting.id);
    setPendingId(null);
    setDeleting(null);
    notify(result.success ? "Foto eliminada." : result.error ?? "Error");
  };

  const photo = (item: AdminMedia, aspect: string, sizes: string) => (
    <button
      type="button"
      className={`relative w-full cursor-crosshair overflow-hidden ${aspect}`}
      aria-label="Tocar para elegir qué parte de la foto queda al centro"
      onClick={setFocal(item)}
      disabled={pendingId === item.id}
    >
      <Image
        src={item.url}
        alt=""
        fill
        sizes={sizes}
        className={`object-cover ${item.isPublished ? "" : "grayscale"}`}
        style={{ objectPosition: `${item.focalX}% ${item.focalY}%` }}
      />
      <span
        className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-gold/70 shadow"
        style={{ left: `${item.focalX}%`, top: `${item.focalY}%` }}
      />
      {!item.isPublished && (
        <span className="absolute inset-x-0 bottom-0 bg-navy/85 py-1 text-center font-sans text-[10px] uppercase tracking-[0.2em] text-blue-mist">
          Oculta
        </span>
      )}
    </button>
  );

  const deleteButton = (item: AdminMedia) => (
    <button
      type="button"
      disabled={pendingId === item.id || busy}
      onClick={() => setDeleting(item)}
      className={`${btnSmall} justify-center px-2.5 hover:!border-red-300/60 hover:!text-red-200`}
      aria-label="Eliminar foto"
    >
      <Trash2 size={14} />
    </button>
  );

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-serif text-3xl text-gold">Fotografías</h1>
        <p className="mt-1 max-w-2xl font-sans text-sm leading-relaxed text-blue-mist">
          Cada espacio indica dónde aparece la foto en la invitación. Sube desde el celular o la computadora; las fotos se
          ajustan solas de tamaño. Después, toca una foto para elegir qué parte queda al centro (por ejemplo, las caras).
        </p>
      </div>

      {progress && (
        <p role="status" className="sticky top-28 z-20 border border-gold/40 bg-navy px-4 py-3 font-sans text-sm text-gold shadow-xl">
          {progress}
        </p>
      )}

      <input
        ref={singleRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          const target = targetRef.current;
          if (target) uploadFiles(files.slice(0, 1), target.usage, target.replacing);
        }}
      />
      <input
        ref={multiRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          uploadFiles(files, "gallery");
        }}
      />

      <section aria-labelledby="slots-title">
        <h2 id="slots-title" className="font-serif text-xl text-blue-ice">Fotos principales</h2>
        <ul className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {SLOTS.map((slot) => {
            const item = slotPhoto(slot.usage);
            return (
              <li key={slot.usage} className={`flex flex-col border bg-blue-dark/40 ${item ? "border-gold/50" : "border-dashed border-gold/30"}`}>
                {item ? (
                  photo(item, slot.aspect, "(min-width: 1024px) 25vw, 50vw")
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => pickFor(slot.usage)}
                    className={`flex w-full flex-col items-center justify-center gap-2 px-3 text-center text-gold transition-colors hover:bg-gold/10 ${slot.aspect}`}
                  >
                    <ImagePlus size={28} strokeWidth={1.3} />
                    <span className="font-sans text-xs uppercase tracking-[0.18em]">Subir foto</span>
                    <span className="font-sans text-[11px] normal-case tracking-normal text-blue-mist">{slot.tip}</span>
                  </button>
                )}
                <div className="flex flex-1 flex-col gap-2 p-3">
                  <p className="font-serif text-lg leading-tight text-gold">{slot.title}</p>
                  <p className="font-sans text-xs leading-snug text-blue-mist">{slot.where}</p>
                  {item && (
                    <div className="mt-auto flex gap-2 pt-1">
                      <button
                        type="button"
                        disabled={busy || pendingId === item.id}
                        onClick={() => pickFor(slot.usage, item)}
                        className={`${btnSmall} flex-1 justify-center px-2`}
                      >
                        <RefreshCw size={14} /> Cambiar
                      </button>
                      <button
                        type="button"
                        disabled={busy || pendingId === item.id}
                        onClick={() => change(item, { usage: "none" }, `Se quitó la foto de «${slot.title}». Quedó en «Otras fotos».`)}
                        className={`${btnSmall} justify-center px-2.5`}
                        aria-label={`Quitar la foto de ${slot.title}`}
                        title="Quitar de este espacio"
                      >
                        <Undo2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="gallery-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="gallery-title" className="font-serif text-xl text-blue-ice">Galería</h2>
            <p className="mt-1 font-sans text-xs text-blue-mist">
              Aparecen en la sección «Nuestra galería», en el orden en que las subes. Puedes elegir varias a la vez.
            </p>
          </div>
          <button type="button" disabled={busy} onClick={() => multiRef.current?.click()} className={btnPrimary}>
            <Images size={15} /> Agregar fotos
          </button>
        </div>

        {gallery.length === 0 ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => multiRef.current?.click()}
            className="mt-4 flex w-full flex-col items-center gap-2 border border-dashed border-gold/30 px-6 py-10 text-center text-gold transition-colors hover:bg-gold/10"
          >
            <Images size={28} strokeWidth={1.3} />
            <span className="font-sans text-sm">Aún no hay fotos en la galería. Toca aquí para agregarlas.</span>
          </button>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {gallery.map((item) => (
              <li key={item.id} className={`flex flex-col border border-gold/20 bg-blue-dark/40 ${pendingId === item.id ? "opacity-60" : ""}`}>
                {photo(item, "aspect-square", "(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw")}
                <div className="flex gap-2 p-2">
                  <button
                    type="button"
                    disabled={pendingId === item.id || busy}
                    onClick={() => change(item, { isPublished: !item.isPublished }, item.isPublished ? "Foto ocultada." : "Foto publicada.")}
                    className={`${btnSmall} flex-1 justify-center px-2`}
                  >
                    {item.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                    {item.isPublished ? "Ocultar" : "Mostrar"}
                  </button>
                  {deleteButton(item)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {unused.length > 0 && (
        <section aria-labelledby="unused-title">
          <h2 id="unused-title" className="font-serif text-xl text-blue-ice">Otras fotos</h2>
          <p className="mt-1 font-sans text-xs text-blue-mist">
            Fotos que no aparecen en la invitación (reemplazadas, ocultas o sin lugar). Puedes asignarles un lugar o borrarlas.
          </p>
          <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {unused.map((item) => (
              <li key={item.id} className={`flex flex-col border border-gold/15 bg-blue-dark/30 ${pendingId === item.id ? "opacity-60" : ""}`}>
                {photo(item, "aspect-square", "(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw")}
                <div className="flex gap-2 p-2">
                  <select
                    aria-label="Usar esta foto como"
                    value=""
                    disabled={pendingId === item.id || busy}
                    onChange={(e) => {
                      const usage = e.target.value as MediaUsage;
                      if (!usage) return;
                      change(item, { usage, isPublished: true }, `Listo: ahora es ${MEDIA_USAGE_LABELS[usage]}.`);
                    }}
                    className={`${inputCls} min-w-0 flex-1 px-2 py-2 text-xs`}
                  >
                    <option value="">Usar como…</option>
                    {REASSIGN_OPTIONS.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  {deleteButton(item)}
                </div>
              </li>
            ))}
          </ul>
        </section>
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
