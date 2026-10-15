/*
 * Analysis of a song in the admin's browser before it is uploaded (no server work, no cost):
 * - where the music really starts and ends, so silences at the ends are skipped;
 * - its loudness (ITU-R BS.1770 style: K-weighting, 400 ms blocks, absolute and relative gates), to
 *   work out the volume correction that brings every song to the same level;
 * - its peak, so the correction never makes it clip.
 */
import { MUSIC, TARGET_LOUDNESS } from "@/lib/music";

export type SongAnalysis = {
  duration: number;
  startAt: number;
  endAt: number | null;
  /** Integrated loudness in LUFS (approximate). */
  loudness: number;
  gain: number;
};

const SILENCE_DB = -50;

type OfflineCtor = typeof OfflineAudioContext;
const Offline = () =>
  (window.OfflineAudioContext ?? (window as unknown as { webkitOfflineAudioContext?: OfflineCtor }).webkitOfflineAudioContext) as OfflineCtor;

/** K-weighting (pre-filter high shelf + RLB high-pass), rendered offline with the browser's own filters. */
async function kWeighted(buffer: AudioBuffer): Promise<AudioBuffer> {
  const Ctx = Offline();
  const ctx = new Ctx(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const shelf = ctx.createBiquadFilter();
  shelf.type = "highshelf";
  shelf.frequency.value = 1500;
  shelf.gain.value = 4;
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 38;
  hp.Q.value = 0.5;
  src.connect(shelf).connect(hp).connect(ctx.destination);
  src.start();
  return ctx.startRendering();
}

export async function analyseSong(file: File): Promise<SongAnalysis> {
  const Ctx = Offline();
  const decoder = new Ctx(1, 1, 44100);
  const buffer = await decoder.decodeAudioData(await file.arrayBuffer());
  const { sampleRate, length, numberOfChannels: channels, duration } = buffer;
  const data = Array.from({ length: channels }, (_, c) => buffer.getChannelData(c));

  // Silence at the ends: 50 ms windows whose level stays under -50 dBFS.
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
  const startAt = first > 0 ? Math.max(0, (first * win) / sampleRate - 0.05) : 0;
  const musicEnd = last >= 0 ? Math.min(duration, ((last + 1) * win) / sampleRate + 0.15) : duration;
  const endAt = duration - musicEnd > 0.3 ? musicEnd : null;

  // Loudness: mean square of K-weighted 400 ms blocks (100 ms hop), gated.
  const k = await kWeighted(buffer);
  const kd = Array.from({ length: channels }, (_, c) => k.getChannelData(c));
  const block = Math.round(sampleRate * 0.4);
  const hop = Math.round(sampleRate * 0.1);
  const blocks: number[] = [];
  for (let s = 0; s + block <= length; s += hop) {
    let z = 0;
    for (let c = 0; c < channels; c++) {
      let sum = 0;
      const ch = kd[c];
      for (let i = s; i < s + block; i++) sum += ch[i] * ch[i];
      z += sum / block;
    }
    blocks.push(z);
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
