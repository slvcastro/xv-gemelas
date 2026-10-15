/*
 * Removes the labels a song file carries inside (title, artist, album, cover picture), in the admin's
 * browser before it is uploaded: the invitation never shows the song's name, and the file guests download
 * must not reveal it either. Only the labels go; the sound is untouched.
 * - MP3 / AAC: ID3v2 at the start; ID3v1, Lyrics3, APE and ID3v2 footers at the end (the bytes are cut).
 * - M4A: the "udta"/"meta" boxes are blanked in place and renamed "free" (players skip it), so the file
 *   keeps its exact size and the positions it records for its own audio stay valid.
 */

export type AudioFormat = "mp3" | "m4a" | "aac";

const isText = (b: Uint8Array, at: number, text: string) => {
  if (at < 0 || at + text.length > b.length) return false;
  for (let i = 0; i < text.length; i++) if (b[at + i] !== text.charCodeAt(i)) return false;
  return true;
};

/** ID3v2 sizes use 7 bits per byte ("syncsafe"). */
const syncsafe = (b: Uint8Array, at: number) =>
  ((b[at] & 0x7f) << 21) | ((b[at + 1] & 0x7f) << 14) | ((b[at + 2] & 0x7f) << 7) | (b[at + 3] & 0x7f);

function stripMpeg(b: Uint8Array): Uint8Array {
  let start = 0;
  // ID3v2 at the start (sometimes more than one in a row).
  while (isText(b, start, "ID3") && start + 10 <= b.length) {
    start += 10 + syncsafe(b, start + 6) + (b[start + 5] & 0x10 ? 10 : 0);
  }
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
      const size = Number(String.fromCharCode(...b.subarray(end - 15, end - 9)));
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

function stripMp4(source: Uint8Array): Uint8Array {
  const b = source.slice();
  const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const eachBox = (from: number, to: number, visit: (type: string, start: number, header: number, end: number) => void) => {
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
      visit(String.fromCharCode(b[p + 4], b[p + 5], b[p + 6], b[p + 7]), p, header, p + size);
      p += size;
    }
  };
  const blank = (start: number, header: number, end: number) => {
    b.set([0x66, 0x72, 0x65, 0x65], start + 4); // "free"
    b.fill(0, start + header, end);
  };
  const isLabels = (type: string) => type === "udta" || type === "meta";

  eachBox(0, b.length, (type, start, header, end) => {
    if (isLabels(type)) blank(start, header, end);
    if (type !== "moov") return;
    eachBox(start + header, end, (t, s, h, e) => {
      if (isLabels(t)) blank(s, h, e);
      if (t === "trak") eachBox(s + h, e, (t2, s2, h2, e2) => isLabels(t2) && blank(s2, h2, e2));
    });
  });
  return b;
}

export function stripTags(bytes: Uint8Array, format: AudioFormat): Uint8Array {
  return format === "m4a" ? stripMp4(bytes) : stripMpeg(bytes);
}
