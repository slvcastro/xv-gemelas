"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Music, Pause, Play, Plus, Trash2 } from "lucide-react";
import {
  addSong,
  deleteSong,
  discardSongUpload,
  moveSong,
  saveMusicSettings,
  setShowSongTitle,
  updateSong,
} from "@/app/actions/songs";
import { MAX_SONG_SECONDS, SongAnalysisError, analyseSong } from "@/lib/audioAnalysis";
import { type AudioFormat, readSongFile } from "@/lib/audioFile";
import { MUSIC_LIMITS, type MusicSettings } from "@/lib/music";
import { ConfirmDialog, btnPrimary, btnSmall, inputCls, labelCls } from "./ui";
import type { AdminSong } from "./types";

// MP3 / AAC only: the formats every phone plays.
const FORMATS: Record<AudioFormat, string> = { mp3: "audio/mpeg", m4a: "audio/mp4", aac: "audio/aac" };
const ACCEPT = ".mp3,.m4a,.aac,audio/mpeg,audio/mp4,audio/x-m4a,audio/aac";
const MAX_MB = 20;
/** Shown when an action could not reach the server (no signal, or the session ended). */
const OFFLINE = "No se pudo conectar. Revisa tu internet (o vuelve a iniciar sesión) e intenta de nuevo.";
const NOT_AUDIO = "Usa un archivo MP3 o M4A: son los que se oyen en todos los celulares.";

/** First filter, by name or type (the file's bytes decide its real format later). */
const looksLikeSong = (file: File) => /\.(mp3|m4a|aac)$/i.test(file.name) || /audio\/(mpeg|mp3|mp4|x-m4a|aac)/.test(file.type);

const mmss = (s: number | null) => {
  if (s == null) return "";
  const t = Math.round(s);
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
};
const db = (gain: number) => {
  const v = 20 * Math.log10(gain);
  return Math.abs(v) < 0.5 ? "sin cambio" : `${v > 0 ? "+" : "−"}${Math.abs(v).toFixed(1)} dB`;
};

/** Name suggested from the file: "Mi_cancion  favorita.mp3" → "Mi cancion favorita". */
const nameFromFile = (file: File) =>
  file.name
    .replace(/\.[^.]+$/, "")
    .replace(/[_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);

function SongRow({
  song,
  index,
  count,
  playing,
  onPreview,
  onDelete,
  notify,
}: {
  song: AdminSong;
  index: number;
  count: number;
  playing: boolean;
  onPreview: () => void;
  onDelete: () => void;
  notify: (m: string) => void;
}) {
  const [title, setTitle] = useState(song.title);
  const [artist, setArtist] = useState(song.artist ?? "");
  // Optimistic: the box changes at once; it goes back if saving fails.
  const [active, setActive] = useState(song.isActive);
  const [pending, start] = useTransition();
  const dirty = title.trim() !== song.title || artist.trim() !== (song.artist ?? "");

  const run = (action: () => Promise<{ success: boolean; error?: string }>, done?: string) =>
    start(async () => {
      try {
        const r = await action();
        if (!r.success) notify(r.error ?? "No se pudo guardar.");
        else if (done) notify(done);
      } catch {
        notify(OFFLINE);
      }
    });

  const length = song.endAt ?? song.duration;
  return (
    <li className={`border px-4 py-4 ${active ? "border-gold/25 bg-navy/40" : "border-gold/10 bg-navy/20 opacity-70"}`}>
      <div className="flex items-start gap-3">
        <span className="mt-2 w-5 shrink-0 text-center font-serif text-lg text-gold">{index + 1}</span>
        <button
          type="button"
          onClick={onPreview}
          className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/50 text-gold transition-colors hover:bg-gold hover:text-navy"
          aria-label={playing ? `Detener «${song.title}»` : `Escuchar «${song.title}»`}
        >
          {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
        </button>
        <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className={labelCls}>Canción</span>
            <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
          </label>
          <label className="block">
            <span className={labelCls}>Artista (opcional)</span>
            <input className={inputCls} value={artist} onChange={(e) => setArtist(e.target.value)} maxLength={120} />
          </label>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 pl-8 sm:pl-[4.25rem]">
        <p className="mr-auto font-sans text-xs text-blue-mist">
          {mmss(length)}
          {length != null && " · "}volumen {db(song.gain)}
          {song.startAt > 0.2 && ` · sin ${song.startAt.toFixed(1)} s de silencio al inicio`}
        </p>
        {dirty && (
          <button
            type="button"
            className={btnSmall}
            disabled={pending}
            onClick={() => run(() => updateSong(song.id, { title, artist }), "Nombre guardado.")}
          >
            Guardar nombre
          </button>
        )}
        <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 font-sans text-xs text-blue-ice">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[#D8C477]"
            checked={active}
            disabled={pending}
            onChange={(e) => {
              const on = e.target.checked;
              setActive(on);
              start(async () => {
                const r = await updateSong(song.id, { isActive: on }).catch(() => ({ success: false as const, error: OFFLINE }));
                if (!r.success) {
                  setActive(!on);
                  notify(r.error);
                }
              });
            }}
          />
          Suena en la invitación
        </label>
        <button
          type="button"
          className={btnSmall}
          disabled={pending || index === 0}
          onClick={() => run(() => moveSong(song.id, -1))}
          aria-label={`Subir «${song.title}»`}
        >
          <ArrowUp size={14} />
        </button>
        <button
          type="button"
          className={btnSmall}
          disabled={pending || index === count - 1}
          onClick={() => run(() => moveSong(song.id, 1))}
          aria-label={`Bajar «${song.title}»`}
        >
          <ArrowDown size={14} />
        </button>
        <button type="button" className={`${btnSmall} hover:!border-red-300 hover:!text-red-200`} onClick={onDelete} aria-label={`Borrar «${song.title}»`}>
          <Trash2 size={14} />
        </button>
      </div>
    </li>
  );
}

/**
 * "Música" in the admin panel: the songs of the invitation (in playing order), whether guests see their
 * names, and uploading new ones. On upload the browser finds the silences at the ends and the song's
 * loudness, so every song starts and ends cleanly and plays at the same level.
 */
/** One setting of the sound: a slider with its value in words and what it means. */
function SoundSlider({
  label,
  value,
  min,
  max,
  step,
  shown,
  hint,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  shown: string;
  hint: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-3">
        <span className="font-sans text-sm text-blue-ice">{label}</span>
        <span className="font-serif text-lg text-gold" aria-hidden="true">
          {shown}
        </span>
      </span>
      <input
        type="range"
        className="mt-2 w-full accent-[#D8C477]"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={shown}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="mt-1 block font-sans text-xs leading-relaxed text-blue-mist">{hint}</span>
    </label>
  );
}

export function MusicPanel({
  songs,
  showTitle,
  settings,
  notify,
}: {
  songs: AdminSong[];
  showTitle: boolean;
  settings: MusicSettings;
  notify: (m: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLAudioElement | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AdminSong | null>(null);
  const [show, setShow] = useState(showTitle);
  const [pending, start] = useTransition();
  // Sound settings: edited here, saved with "Guardar ajustes".
  const [volume, setVolume] = useState(Math.round(settings.volume * 100));
  const [fadeIn, setFadeIn] = useState(Math.round(settings.fadeIn));
  const [crossfade, setCrossfade] = useState(Math.round(settings.crossfade));
  const [savingSettings, startSaving] = useTransition();
  const settingsChanged =
    volume !== Math.round(settings.volume * 100) ||
    fadeIn !== Math.round(settings.fadeIn) ||
    crossfade !== Math.round(settings.crossfade);

  const previewOut = useRef<{ ctx: AudioContext; gain: GainNode; source?: MediaElementAudioSourceNode } | null>(null);
  /** Correction of the song being previewed, so moving the volume slider is heard at once. */
  const previewGain = useRef(1);
  const levelFor = (gain: number, vol = volume) => Math.min(1, (vol / 100) * gain);

  const changeVolume = (v: number) => {
    setVolume(v);
    const out = previewOut.current;
    if (out && previewId) out.gain.gain.setTargetAtTime(levelFor(previewGain.current, v), out.ctx.currentTime, 0.05);
    else if (previewRef.current && previewId) previewRef.current.volume = levelFor(previewGain.current, v);
  };

  useEffect(
    () => () => {
      previewRef.current?.pause();
      void previewOut.current?.ctx.close();
    },
    []
  );

  const preview = (song: AdminSong) => {
    previewRef.current?.pause();
    if (previewId === song.id) {
      setPreviewId(null);
      return;
    }
    const a = new Audio();
    a.crossOrigin = "anonymous"; // loaded the same way guests load it
    a.src = song.url;
    a.currentTime = song.startAt;
    // Through Web Audio, as in the invitation, at the volume chosen below: what guests will hear.
    previewGain.current = song.gain;
    const level = levelFor(song.gain);
    try {
      if (!previewOut.current) {
        const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AC();
        const gain = ctx.createGain();
        gain.connect(ctx.destination);
        previewOut.current = { ctx, gain };
      }
      const out = previewOut.current;
      out.source?.disconnect();
      out.source = out.ctx.createMediaElementSource(a);
      out.source.connect(out.gain);
      out.gain.gain.value = level;
      void out.ctx.resume();
    } catch {
      a.volume = Math.min(1, level);
    }
    a.onended = () => setPreviewId(null);
    void a.play().catch(() => notify("No se pudo reproducir la canción en este navegador."));
    previewRef.current = a;
    setPreviewId(song.id);
  };

  const upload = async (picked: File) => {
    if (!looksLikeSong(picked)) {
      notify(NOT_AUDIO);
      return;
    }
    if (picked.size > MAX_MB * 1024 * 1024) {
      notify(`El archivo pesa ${(picked.size / 1048576).toFixed(1)} MB; el máximo es ${MAX_MB} MB. Usa un MP3 de 128 kbps.`);
      return;
    }
    let uploaded: string | null = null;
    try {
      setProgress("Preparando la canción…");
      // Its real format comes from its bytes, and its hidden labels (song name, artist, cover) are removed,
      // so the file can't reveal the song either.
      const song = readSongFile(new Uint8Array(await picked.arrayBuffer()));
      if (!song) throw new Error(NOT_AUDIO);
      if (song.fragmented) {
        throw new Error("Este M4A viene en un formato de streaming (fragmentado) que no se puede preparar. Usa un MP3.");
      }
      if (song.codec && song.codec !== "mp4a") {
        throw new Error("Este M4A no está en AAC (por ejemplo, es Apple Lossless) y no se oiría en todos los celulares. Usa un MP3.");
      }
      if (song.seconds && song.seconds > MAX_SONG_SECONDS) {
        throw new Error(`La canción dura ${mmss(song.seconds)}; el máximo es 12:00. Usa una versión más corta.`);
      }
      const { format } = song;
      const file = new File([song.bytes as Uint8Array<ArrayBuffer>], `cancion.${format}`, { type: FORMATS[format] });
      setProgress("Analizando la canción…");
      const info = await analyseSong(file, (done) => setProgress(`Analizando la canción… ${Math.round(done * 100)}%`)).catch((e) => {
        throw e instanceof SongAnalysisError ? e : new Error("Este archivo no se pudo leer como audio. Prueba con un MP3.");
      });
      const { upload: put } = await import("@vercel/blob/client");
      setProgress("Subiendo…");
      // A neutral file name: the song's name never appears in its web address.
      const blob = await put(`musica/cancion.${format}`, file, {
        access: "public",
        contentType: FORMATS[format],
        handleUploadUrl: "/api/upload",
        multipart: file.size > 8 * 1024 * 1024,
        onUploadProgress: ({ percentage }) => setProgress(`Subiendo… ${Math.round(percentage)}%`),
      });
      uploaded = blob.url;
      // Guests' phones play it through Web Audio, which needs the file to allow being read from the site.
      setProgress("Comprobando…");
      const playable = await fetch(blob.url, { method: "HEAD", cache: "no-store" }).then(
        (r) => r.ok,
        () => false
      );
      if (!playable) throw new Error("El archivo se subió pero no se puede reproducir desde la invitación. Intenta más tarde.");
      const result = await addSong({
        url: blob.url,
        title: nameFromFile(picked),
        gain: info.gain,
        startAt: info.startAt,
        endAt: info.endAt,
        duration: info.duration,
      });
      if (!result.success) throw new Error(result.error);
      uploaded = null;
      notify(
        file.size > 6 * 1024 * 1024
          ? `Canción agregada. Pesa ${(file.size / 1048576).toFixed(1)} MB: si puedes, usa una versión de 128 kbps para que cargue más rápido en los celulares.`
          : "Canción agregada al final de la lista. Revisa su nombre."
      );
    } catch (err) {
      // An upload that could not be added is deleted, so it doesn't take up space.
      if (uploaded) void discardSongUpload(uploaded).catch(() => {});
      const reason = err instanceof Error ? err.message : "";
      notify(
        /client token/i.test(reason)
          ? "No se pudo autorizar la subida. Verifica que Vercel Blob esté conectado y que sigas con la sesión iniciada."
          : /fetch|network|load failed/i.test(reason)
            ? OFFLINE
            : `No se pudo agregar la canción. ${reason}`
      );
    } finally {
      setProgress(null);
    }
  };

  const activeCount = songs.filter((s) => s.isActive).length;

  return (
    <section className="mx-auto max-w-3xl">
      <div className="flex items-center gap-3">
        <Music className="text-gold" size={22} aria-hidden="true" />
        <h2 className="font-serif text-2xl text-gold">Música de fondo</h2>
      </div>
      <p className="mt-2 text-pretty font-sans text-sm leading-relaxed text-blue-ice/80">
        Empieza cuando el invitado toca «Abrir invitación»: suenan las canciones activas en este orden, cada una se
        mezcla con la siguiente y la lista vuelve a empezar. Cada invitado puede pausarla con el botón dorado.
      </p>

      <div className="mt-6 border border-gold/30 bg-navy/50 px-4 py-4">
        <h3 className="font-serif text-lg text-gold">Ajustes del sonido</h3>
        <div className="mt-4 space-y-5">
          <SoundSlider
            label="Volumen máximo"
            value={volume}
            min={MUSIC_LIMITS.volume.min * 100}
            max={MUSIC_LIMITS.volume.max * 100}
            step={5}
            shown={`${volume} %`}
            hint="Lo más fuerte que suena la música en los celulares de los invitados. Si escuchas una canción de la lista de abajo, la oyes con este volumen."
            onChange={changeVolume}
          />
          <SoundSlider
            label="Entrada suave al abrir la invitación"
            value={fadeIn}
            min={MUSIC_LIMITS.fadeIn.min}
            max={MUSIC_LIMITS.fadeIn.max}
            step={1}
            shown={fadeIn === 0 ? "Apagada" : `${fadeIn} s`}
            hint={
              fadeIn === 0
                ? "La música empieza de inmediato, ya con su volumen."
                : `La música sube desde el silencio durante ${fadeIn} segundos.`
            }
            onChange={setFadeIn}
          />
          <SoundSlider
            label="Mezcla entre canciones (crossfade)"
            value={crossfade}
            min={MUSIC_LIMITS.crossfade.min}
            max={MUSIC_LIMITS.crossfade.max}
            step={1}
            shown={crossfade === 0 ? "Sin mezcla" : `${crossfade} s`}
            hint={
              crossfade === 0
                ? "Cada canción empieza justo cuando termina la anterior."
                : `Durante ${crossfade} segundos la canción que termina va bajando mientras la siguiente va subiendo. También cuando la lista vuelve a empezar.`
            }
            onChange={setCrossfade}
          />
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className={btnPrimary}
            disabled={!settingsChanged || savingSettings}
            onClick={() =>
              startSaving(async () => {
                const r = await saveMusicSettings({ volume: volume / 100, fadeIn, crossfade }).catch(() => ({
                  success: false as const,
                  error: OFFLINE,
                }));
                notify(r.success ? "Ajustes del sonido guardados." : r.error);
              })
            }
          >
            {savingSettings ? "Guardando…" : "Guardar ajustes"}
          </button>
          {settingsChanged && !savingSettings && <span className="font-sans text-xs text-amber-200">Cambios sin guardar</span>}
        </div>
      </div>

      <div className="mt-6 border border-gold/30 bg-navy/50 px-4 py-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            className="mt-0.5 h-5 w-5 shrink-0 accent-[#D8C477]"
            checked={show}
            disabled={pending}
            onChange={(e) => {
              const on = e.target.checked;
              setShow(on);
              start(async () => {
                const r = await setShowSongTitle(on).catch(() => ({ success: false as const, error: OFFLINE }));
                if (!r.success) setShow(!on);
                notify(r.success ? (on ? "Los invitados verán el nombre de la canción." : "El nombre de la canción quedó oculto.") : r.error);
              });
            }}
          />
          <span>
            <span className="block font-sans text-sm text-blue-ice">Mostrar a los invitados el nombre de la canción</span>
            <span className="mt-1 block font-sans text-xs leading-relaxed text-blue-mist">
              {show
                ? "Encendido: al empezar la música verán «♪ Canción · Artista» junto al botón."
                : "Apagado (recomendado): solo ven el botón de música; el nombre no aparece en ningún lado de la invitación."}
            </span>
          </span>
        </label>
      </div>

      <ol className="mt-6 space-y-3">
        {songs.map((song, i) => (
          <SongRow
            key={song.id}
            song={song}
            index={i}
            count={songs.length}
            playing={previewId === song.id}
            onPreview={() => preview(song)}
            onDelete={() => setDeleting(song)}
            notify={notify}
          />
        ))}
      </ol>
      {songs.length === 0 && (
        <p className="mt-6 border border-dashed border-gold/25 px-4 py-6 text-center font-sans text-sm text-blue-mist">
          No hay canciones: la invitación no tendrá música hasta que agregues una.
        </p>
      )}
      {songs.length > 0 && activeCount === 0 && (
        <p className="mt-3 font-sans text-xs text-amber-200">Ninguna canción está activa: la invitación no tendrá música.</p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="button" className={btnPrimary} disabled={progress !== null} onClick={() => fileRef.current?.click()}>
          <Plus size={16} /> Agregar canción
        </button>
        {progress && (
          <span className="font-sans text-sm text-gold" role="status">
            {progress}
          </span>
        )}
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) void upload(f);
          }}
        />
      </div>
      <p className="mt-3 font-sans text-xs leading-relaxed text-blue-mist">
        En MP3 o M4A; mejor MP3 de 128 kbps (unos 3–4 MB por canción) para que cargue rápido en los celulares; máximo{" "}
        {MAX_MB} MB. Al subirla se quitan los silencios del inicio y del final, se nivela su volumen con las demás y se
        borra el nombre que el archivo trae guardado por dentro.
      </p>

      {deleting && (
        <ConfirmDialog
          title="Borrar canción"
          message={
            <>
              ¿Borrar «{deleting.title}»? Ya no sonará en la invitación.
              {activeCount === 1 && deleting.isActive && " Es la única canción activa: la invitación se quedará sin música."}
            </>
          }
          confirmLabel="Borrar"
          busy={pending}
          onClose={() => setDeleting(null)}
          onConfirm={() =>
            start(async () => {
              if (previewId === deleting.id) {
                previewRef.current?.pause();
                setPreviewId(null);
              }
              const r = await deleteSong(deleting.id).catch(() => ({ success: false as const, error: OFFLINE }));
              notify(r.success ? "Canción borrada." : r.error);
              setDeleting(null);
            })
          }
        />
      )}
    </section>
  );
}
