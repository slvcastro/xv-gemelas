/*
 * Analysis of a song in the admin's browser before it is uploaded (no server work, no cost):
 * - where the music really starts and ends, so silences at the ends are skipped;
 * - its loudness (ITU-R BS.1770: K-weighting, 400 ms blocks, absolute and relative gates), to work out
 *   the volume correction that brings every song to the same level;
 * - its peak, so the correction never makes it clip.
 * Memory: the decoded song is filtered in place, so a phone only holds one copy of it.
 */
import { MUSIC, TARGET_LOUDNESS } from "@/lib/music";

export type SongAnalysis = {
  duration: number;
  startAt: number;
  endAt: number | null;
  /** Integrated loudness in LUFS. */
  loudness: number;
  gain: number;
};

/** Longest song accepted: decoding a longer one could use more memory than a phone allows. */
export const MAX_SONG_MINUTES = 12;

/** A reason the admin should read as is (the panel shows its message). */
export class SongAnalysisError extends Error {}

const SILENCE_DB = -50;
const SAMPLE_RATE = 44100;

type OfflineCtor = typeof OfflineAudioContext;
const Offline = () =>
  (window.OfflineAudioContext ?? (window as unknown as { webkitOfflineAudioContext?: OfflineCtor }).webkitOfflineAudioContext) as OfflineCtor;

/** Length from the file's own header, without decoding it (null if the browser can't tell). */
function quickDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    const done = (value: number | null) => {
      clearTimeout(timer);
      audio.onloadedmetadata = audio.onerror = null;
      audio.removeAttribute("src");
      URL.revokeObjectURL(url);
      resolve(value);
    };
    const timer = setTimeout(() => done(null), 8000);
    audio.preload = "metadata";
    audio.onloadedmetadata = () => done(Number.isFinite(audio.duration) ? audio.duration : null);
    audio.onerror = () => done(null);
    audio.src = url;
  });
}

/**
 * K-weighting (BS.1770 pre-filter shelf + RLB high-pass), applied in place. Coefficients for any sample
 * rate, as in libebur128.
 */
function kWeightInPlace(x: Float32Array, rate: number) {
  let K = Math.tan((Math.PI * 1681.974450955533) / rate);
  let Q = 0.7071752369554196;
  const Vh = 10 ** (3.999843853973347 / 20);
  const Vb = Vh ** 0.4996667741545416;
  let a0 = 1 + K / Q + K * K;
  const pb0 = (Vh + (Vb * K) / Q + K * K) / a0;
  const pb1 = (2 * (K * K - Vh)) / a0;
  const pb2 = (Vh - (Vb * K) / Q + K * K) / a0;
  const pa1 = (2 * (K * K - 1)) / a0;
  const pa2 = (1 - K / Q + K * K) / a0;

  K = Math.tan((Math.PI * 38.13547087602444) / rate);
  Q = 0.5003270373238773;
  a0 = 1 + K / Q + K * K;
  const ra1 = (2 * (K * K - 1)) / a0;
  const ra2 = (1 - K / Q + K * K) / a0;

  // Direct form II for both stages.
  let p1 = 0;
  let p2 = 0;
  let r1 = 0;
  let r2 = 0;
  for (let i = 0; i < x.length; i++) {
    const p0 = x[i] - pa1 * p1 - pa2 * p2;
    const shelf = pb0 * p0 + pb1 * p1 + pb2 * p2;
    p2 = p1;
    p1 = p0;
    const r0 = shelf - ra1 * r1 - ra2 * r2;
    x[i] = r0 - 2 * r1 + r2;
    r2 = r1;
    r1 = r0;
  }
}

export async function analyseSong(file: File): Promise<SongAnalysis> {
  const declared = await quickDuration(file);
  if (declared && declared > MAX_SONG_MINUTES * 60) {
    throw new SongAnalysisError(
      `La canción dura ${Math.round(declared / 60)} minutos; el máximo es ${MAX_SONG_MINUTES}. Usa una versión más corta.`
    );
  }

  const Ctx = Offline();
  const decoder = new Ctx(1, 1, SAMPLE_RATE);
  const buffer = await decoder.decodeAudioData(await file.arrayBuffer());
  const { sampleRate, length, numberOfChannels: channels, duration } = buffer;
  if (duration > MAX_SONG_MINUTES * 60 + 5) {
    throw new SongAnalysisError(`La canción dura más de ${MAX_SONG_MINUTES} minutos. Usa una versión más corta.`);
  }
  const data = Array.from({ length: channels }, (_, c) => buffer.getChannelData(c));

  // Silence at the ends (50 ms windows under -50 dBFS) and the peak, on the original samples.
  const win = Math.round(sampleRate * 0.05);
  const threshold = 10 ** (SILENCE_DB / 20);
  let peak = 0;
  let first = -1;
  let last = -1;
  for (let w = 0; w * win < length; w++) {
    let sum = 0;
    const end = Math.min(length, (w + 1) * win);
    for (let c = 0; c < channels; c++) {
      const ch = data[c];
      for (let i = w * win; i < end; i++) {
        const v = ch[i];
        sum += v * v;
        const a = v < 0 ? -v : v;
        if (a > peak) peak = a;
      }
    }
    const rms = Math.sqrt(sum / ((end - w * win) * channels));
    if (rms > threshold) {
      if (first < 0) first = w;
      last = w;
    }
  }
  if (first < 0) throw new SongAnalysisError("El archivo no tiene sonido (solo silencio).");
  const startAt = first > 0 ? Math.max(0, (first * win) / sampleRate - 0.05) : 0;
  const musicEnd = Math.min(duration, ((last + 1) * win) / sampleRate + 0.15);
  const endAt = duration - musicEnd > 0.3 ? musicEnd : null;

  // Loudness: mean square of K-weighted 400 ms blocks every 100 ms, from 100 ms segment sums.
  const hop = Math.round(sampleRate * 0.1);
  const segments = Math.floor(length / hop);
  const segSum = new Float64Array(segments);
  for (let c = 0; c < channels; c++) {
    const ch = data[c];
    kWeightInPlace(ch, sampleRate);
    for (let s = 0; s < segments; s++) {
      let sum = 0;
      for (let i = s * hop, e = i + hop; i < e; i++) sum += ch[i] * ch[i];
      segSum[s] += sum;
    }
  }
  // A mono song plays from both speakers, so it counts as two equal channels (BS.1770 dual mono).
  const weight = channels === 1 ? 2 : 1;
  const blocks: number[] = [];
  for (let s = 0; s + 4 <= segments; s++) {
    blocks.push((weight * (segSum[s] + segSum[s + 1] + segSum[s + 2] + segSum[s + 3])) / (4 * hop));
  }
  const lufs = (z: number) => -0.691 + 10 * Math.log10(z);
  const absGated = blocks.filter((z) => lufs(z) > -70);
  const mean = (list: number[]) => list.reduce((a, b) => a + b, 0) / Math.max(1, list.length);
  const relGate = lufs(mean(absGated)) - 10;
  const gated = absGated.filter((z) => lufs(z) > relGate);
  const loudness = gated.length ? lufs(mean(gated)) : -30;

  // Correction to the common level, without letting the loudest moment go over full scale.
  let gain = 10 ** ((TARGET_LOUDNESS - loudness) / 20);
  if (peak > 0) gain = Math.min(gain, 0.98 / (MUSIC.volume * peak));
  gain = Math.min(4, Math.max(0.05, gain));

  return { duration, startAt, endAt, loudness, gain };
}
