/*
 * A song file read in the admin's browser before it is uploaded (no server work, no cost):
 * - its real format, from its bytes (a name can lie: some apps save M4A audio as ".mp3");
 * - its length, from its own headers, so a song too long for a phone is refused before decoding it;
 * - its hidden labels (title, artist, album, cover, chapters), removed: the invitation never shows the
 *   song's name, and the file guests download must not reveal it either. The sound is untouched.
 *   MP3 / AAC: ID3v2 at the start; ID3v1, Lyrics3, APE and ID3v2 footers at the end (the bytes are cut).
 *   M4A: label boxes and any track that is not sound (chapters, pictures) are blanked in place and
 *   renamed "free" (players skip it), so the file keeps its exact size and the positions it records
 *   for its own audio stay valid.
 */

export type AudioFormat = "mp3" | "m4a" | "aac";

export type SongFile = {
  format: AudioFormat;
  /** The file without its labels. */
  bytes: Uint8Array;
  /** Length in seconds from the headers (null if they don't say). */
  seconds: number | null;
  /** M4A only: the audio codec ("mp4a" is AAC; "alac" is Apple Lossless, which many phones can't play). */
  codec: string | null;
};

const isText = (b: Uint8Array, at: number, text: string) => {
  if (at < 0 || at + text.length > b.length) return false;
  for (let i = 0; i < text.length; i++) if (b[at + i] !== text.charCodeAt(i)) return false;
  return true;
};
const textAt = (b: Uint8Array, at: number, length: number) =>
  at + length <= b.length ? String.fromCharCode(...b.subarray(at, at + length)) : "";

/** ID3v2 sizes use 7 bits per byte ("syncsafe"). */
const syncsafe = (b: Uint8Array, at: number) =>
  ((b[at] & 0x7f) << 21) | ((b[at + 1] & 0x7f) << 14) | ((b[at + 2] & 0x7f) << 7) | (b[at + 3] & 0x7f);

/** Where the audio starts: after the ID3v2 tags at the beginning (sometimes more than one). */
function afterId3(b: Uint8Array) {
  let p = 0;
  while (isText(b, p, "ID3") && p + 10 <= b.length) p += 10 + syncsafe(b, p + 6) + (b[p + 5] & 0x10 ? 10 : 0);
  return p;
}

// ---------- MP3 / AAC frames ----------

type Frame = { size: number; samples: number; rate: number };

const MPEG_RATES = [[11025, 12000, 8000], [], [22050, 24000, 16000], [44100, 48000, 32000]];
const KBPS = {
  v1l1: [0, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448],
  v1l2: [0, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384],
  v1l3: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],
  v2l1: [0, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256],
  v2l23: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
};

function mpegFrame(b: Uint8Array, i: number): Frame | null {
  if (i + 4 > b.length || b[i] !== 0xff || (b[i + 1] & 0xe0) !== 0xe0) return null;
  const version = (b[i + 1] >> 3) & 3; // 3 MPEG-1, 2 MPEG-2, 0 MPEG-2.5
  const layer = (b[i + 1] >> 1) & 3; // 1 Layer III, 2 Layer II, 3 Layer I
  const bitrateIndex = b[i + 2] >> 4;
  const rateIndex = (b[i + 2] >> 2) & 3;
  if (version === 1 || layer === 0 || bitrateIndex === 0 || bitrateIndex === 15 || rateIndex === 3) return null;
  const v1 = version === 3;
  const table = layer === 3 ? (v1 ? KBPS.v1l1 : KBPS.v2l1) : v1 ? (layer === 2 ? KBPS.v1l2 : KBPS.v1l3) : KBPS.v2l23;
  const bitrate = table[bitrateIndex] * 1000;
  const rate = MPEG_RATES[version][rateIndex];
  const padding = (b[i + 2] >> 1) & 1;
  if (layer === 3) return { size: (Math.floor((12 * bitrate) / rate) + padding) * 4, samples: 384, rate };
  const samples = layer === 1 && !v1 ? 576 : 1152;
  return { size: Math.floor((samples / 8) * (bitrate / rate)) + padding, samples, rate };
}

const ADTS_RATES = [96000, 88200, 64000, 48000, 44100, 32000, 24000, 22050, 16000, 12000, 11025, 8000, 7350];

function adtsFrame(b: Uint8Array, i: number): Frame | null {
  if (i + 7 > b.length || b[i] !== 0xff || (b[i + 1] & 0xf6) !== 0xf0) return null;
  const rate = ADTS_RATES[(b[i + 2] >> 2) & 0xf];
  const size = ((b[i + 3] & 3) << 11) | (b[i + 4] << 3) | (b[i + 5] >> 5);
  if (!rate || size < 7) return null;
  return { size, samples: 1024 * ((b[i + 6] & 3) + 1), rate };
}

/** A frame that is followed by another one (a lone match could be chance). */
const twoFrames = (b: Uint8Array, i: number, read: (b: Uint8Array, i: number) => Frame | null) => {
  const f = read(b, i);
  return !!f && (i + f.size === b.length || !!read(b, i + f.size));
};

/** Exact length, adding up every frame (a header's estimate can be far off for VBR files). */
function framesSeconds(b: Uint8Array, read: (b: Uint8Array, i: number) => Frame | null) {
  let seconds = 0;
  let frames = 0;
  for (let p = afterId3(b); p + 4 <= b.length; ) {
    const f = read(b, p);
    if (f && p + f.size <= b.length) {
      seconds += f.samples / f.rate;
      frames++;
      p += f.size;
    } else {
      p++; // not a frame (padding, tags at the end): look further
    }
  }
  return frames ? seconds : null;
}

function stripMpeg(b: Uint8Array): Uint8Array {
  const start = afterId3(b);
  if (start >= b.length) return b; // not a real tag: leave the file as it was

  let end = b.length;
  for (let found = true; found; ) {
    found = false;
    // ID3v1 (128 bytes) and its "TAG+" extension (227 bytes just before it).
    if (isText(b, end - 128, "TAG") && end - 128 >= start) {
      end -= 128;
      if (isText(b, end - 227, "TAG+") && end - 227 >= start) end -= 227;
      found = true;
    }
    // Lyrics3 v2: "LYRICSBEGIN" … six-digit size + "LYRICS200".
    if (isText(b, end - 9, "LYRICS200")) {
      const size = Number(textAt(b, end - 15, 6));
      if (Number.isInteger(size) && end - 15 - size >= start && isText(b, end - 15 - size, "LYRICSBEGIN")) {
        end -= 15 + size;
        found = true;
      }
    }
    // APEv2: 32-byte footer "APETAGEX"; its size counts the items and the footer, plus a header if flagged.
    if (isText(b, end - 32, "APETAGEX")) {
      const view = new DataView(b.buffer, b.byteOffset + end - 32, 32);
      const total = view.getUint32(12, true) + (view.getUint32(20, true) & 0x80000000 ? 32 : 0);
      if (total >= 32 && end - total >= start) {
        end -= total;
        found = true;
      }
    }
    // ID3v2 placed at the end, found by its 10-byte footer "3DI".
    if (isText(b, end - 10, "3DI")) {
      const total = 20 + syncsafe(b, end - 4);
      if (end - total >= start && isText(b, end - total, "ID3")) {
        end -= total;
        found = true;
      }
    }
  }
  return start === 0 && end === b.length ? b : b.subarray(start, end);
}

// ---------- M4A boxes ----------

/** [start, header size, end] of a box. */
type Box = [number, number, number];

function eachBox(b: Uint8Array, from: number, to: number, visit: (type: string, box: Box) => void) {
  const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
  let p = from;
  while (p + 8 <= to) {
    let size = view.getUint32(p);
    let header = 8;
    if (size === 1) {
      if (p + 16 > to) return;
      size = view.getUint32(p + 8) * 2 ** 32 + view.getUint32(p + 12);
      header = 16;
    } else if (size === 0) {
      size = to - p;
    }
    if (size < header || p + size > to) return;
    visit(textAt(b, p + 4, 4), [p, header, p + size]);
    p += size;
  }
}

const child = (b: Uint8Array, [start, header, end]: Box, type: string) => {
  let found: Box | null = null;
  eachBox(b, start + header, end, (t, box) => {
    if (!found && t === type) found = box;
  });
  return found as Box | null;
};
const descend = (b: Uint8Array, box: Box, ...types: string[]) =>
  types.reduce<Box | null>((at, type) => (at ? child(b, at, type) : null), box);

/** Erases a box's contents and renames it "free": same size, ignored by players. */
const blank = (b: Uint8Array, [start, header, end]: Box) => {
  b.set([0x66, 0x72, 0x65, 0x65], start + 4);
  b.fill(0, start + header, end);
};

/** Erases a track's samples (e.g. chapter titles) wherever they sit in the file. */
function eraseSamples(b: Uint8Array, stbl: Box) {
  const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const sizes = child(b, stbl, "stsz");
  const chunksOf = child(b, stbl, "stsc");
  const offsets = child(b, stbl, "stco") ?? child(b, stbl, "co64");
  if (!sizes || !chunksOf || !offsets) return;
  const sz = sizes[0] + sizes[1];
  const fixedSize = view.getUint32(sz + 4);
  const count = view.getUint32(sz + 8);
  const co = offsets[0] + offsets[1];
  const chunks = view.getUint32(co + 4);
  const wide = textAt(b, offsets[0] + 4, 4) === "co64";
  const sc = chunksOf[0] + chunksOf[1];
  const entries = view.getUint32(sc + 4);
  let sample = 0;
  for (let e = 0; e < entries && sample < count; e++) {
    const first = view.getUint32(sc + 8 + 12 * e);
    const perChunk = view.getUint32(sc + 12 + 12 * e);
    const next = e + 1 < entries ? view.getUint32(sc + 8 + 12 * (e + 1)) : chunks + 1;
    for (let chunk = first; chunk < next && chunk <= chunks && sample < count; chunk++) {
      let pos = wide
        ? view.getUint32(co + 8 + 8 * (chunk - 1)) * 2 ** 32 + view.getUint32(co + 12 + 8 * (chunk - 1))
        : view.getUint32(co + 8 + 4 * (chunk - 1));
      for (let k = 0; k < perChunk && sample < count && pos < b.length; k++, sample++) {
        const size = fixedSize || view.getUint32(sz + 12 + 4 * sample);
        b.fill(0, pos, Math.min(b.length, pos + size));
        pos += size;
      }
    }
  }
}

function readMp4(source: Uint8Array): SongFile {
  const b = source.slice();
  const isLabels = (type: string) => type === "udta" || type === "meta";
  let seconds: number | null = null;
  let codec: string | null = null;

  eachBox(b, 0, b.length, (type, box) => {
    if (isLabels(type)) blank(b, box);
    if (type !== "moov") return;
    eachBox(b, box[0] + box[1], box[2], (t, inner) => {
      if (isLabels(t)) blank(b, inner);
      if (t === "mvhd") {
        const p = inner[0] + inner[1];
        const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
        const [scale, length] =
          b[p] === 1
            ? [view.getUint32(p + 20), view.getUint32(p + 24) * 2 ** 32 + view.getUint32(p + 28)]
            : [view.getUint32(p + 12), view.getUint32(p + 16)];
        if (scale) seconds = length / scale;
      }
      if (t !== "trak") return;
      const hdlr = descend(b, inner, "mdia", "hdlr");
      const handler = hdlr ? textAt(b, hdlr[0] + hdlr[1] + 8, 4) : "";
      const stbl = descend(b, inner, "mdia", "minf", "stbl");
      if (handler === "soun" || !handler) {
        const stsd = stbl && child(b, stbl, "stsd");
        if (stsd && !codec) codec = textAt(b, stsd[0] + stsd[1] + 12, 4);
        // Its own labels and its link to a chapter track go.
        eachBox(b, inner[0] + inner[1], inner[2], (t2, box2) => (isLabels(t2) || t2 === "tref") && blank(b, box2));
      } else {
        // Chapters, pictures, lyrics…: their contents are erased and the track removed.
        if (stbl) eraseSamples(b, stbl);
        blank(b, inner);
      }
    });
  });
  return { format: "m4a", bytes: b, seconds, codec };
}

// ---------- Entry point ----------

const MP4_START = ["ftyp", "moov", "mdat", "free", "skip", "wide"];

/** The real format, from the bytes; null if the file is not MP3, AAC or M4A. */
export function sniffFormat(b: Uint8Array): AudioFormat | null {
  if (MP4_START.some((type) => isText(b, 4, type))) return "m4a";
  // The first frame, within the first 64 KB of audio (some files start with padding).
  for (let i = afterId3(b), end = Math.min(b.length - 4, i + 65536); i < end; i++) {
    if (b[i] !== 0xff) continue;
    if (twoFrames(b, i, adtsFrame)) return "aac";
    if (twoFrames(b, i, mpegFrame)) return "mp3";
  }
  return null;
}

/** Reads a song file: real format, length, codec, and the bytes without labels. Null if unusable. */
export function readSongFile(raw: Uint8Array): SongFile | null {
  try {
    const format = sniffFormat(raw);
    if (format === "m4a") {
      const song = readMp4(raw);
      return song.codec ? song : null; // no sound track found
    }
    if (!format) return null;
    const bytes = stripMpeg(raw);
    return { format, bytes, seconds: framesSeconds(bytes, format === "aac" ? adtsFrame : mpegFrame), codec: null };
  } catch {
    return null; // a damaged file
  }
}
