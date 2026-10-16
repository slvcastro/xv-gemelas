/*
 * Background music player (browser only). One player for the whole page, shared by the envelope
 * (which starts it on the "Abrir invitación" tap, the gesture browsers require before sound) and the
 * floating button (MusicButton), which follows its state through subscribe()/getState().
 *
 * Two "decks" (audio elements) take turns, so one song can blend into the next (crossfade) and a song
 * that is alone can blend into its own beginning when it starts over. Volume goes through the Web Audio
 * API: on iPhone an <audio> element's volume cannot be changed from code, so fades would be impossible.
 * Each deck has its own volume (the song's level and the blends); a master volume does the pauses.
 * The admin panel sets the maximum volume, the rise when the envelope opens and the blend length.
 * Polite behaviour: the guest's pause is remembered on this device; the music pauses by itself when the
 * page is hidden (another app, locked phone) and comes back when the guest returns. A song that can't be
 * played is skipped, so the music never gets stuck.
 */
import { DEFAULT_MUSIC_SETTINGS, MUSIC, type MusicSettings, type PublicTrack } from "@/lib/music";

export type MusicStatus = "idle" | "loading" | "playing" | "paused";
export type MusicState = {
  status: MusicStatus;
  index: number;
  track: PublicTrack | null;
  /** Set when the hint next to the button should show for a moment (start, next song, paused). */
  announce: number;
};

const PREF_KEY = "kk-music";
const INITIAL: MusicState = { status: "idle", index: 0, track: null, announce: 0 };

let playlist: PublicTrack[] = [];
let settings: MusicSettings = DEFAULT_MUSIC_SETTINGS;
let state = INITIAL;

/** Songs and sound settings for this page (from the server). Only taken before the music starts. */
export function setPlaylist(tracks: PublicTrack[], soundSettings: MusicSettings = DEFAULT_MUSIC_SETTINGS) {
  if (state.status !== "idle") return;
  playlist = tracks.filter((t) => t.sources.length > 0);
  settings = soundSettings;
  state = { ...state, index: 0, track: playlist[0] ?? null };
}

const listeners = new Set<() => void>();
function update(patch: Partial<MusicState>) {
  state = { ...state, ...patch };
  for (const l of listeners) l();
}
export const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export const getState = () => state;
export const getServerState = () => INITIAL;

const readPref = () => {
  try {
    return localStorage.getItem(PREF_KEY);
  } catch {
    return null;
  }
};
const writePref = (value: "on" | "off") => {
  try {
    localStorage.setItem(PREF_KEY, value);
  } catch {
    /* private mode: the choice just isn't remembered */
  }
};

// ---------- Volumes that move smoothly ----------

let ctx: AudioContext | null = null;

/**
 * Equal-power curve: a rising volume comes in quickly at first and a falling one holds on, so in a blend
 * the two songs together keep an even loudness, and a fade-in is heard from its first moment.
 */
const curve = (from: number, to: number, t: number) =>
  to >= from ? from + (to - from) * Math.sin((t * Math.PI) / 2) : to + (from - to) * Math.cos((t * Math.PI) / 2);

/** A volume on a Web Audio gain or, without Web Audio, a number applied to the element by a timer. */
class Fader {
  private from = 0;
  private to = 0;
  private start = 0;
  private length = 0;
  private readonly param: AudioParam | null;

  constructor(param: AudioParam | null) {
    this.param = param;
    if (param) param.value = 0;
  }

  get hasParam() {
    return this.param !== null;
  }
  get target() {
    return this.to;
  }
  private now() {
    return this.param && ctx ? ctx.currentTime : performance.now() / 1000;
  }
  get moving() {
    return this.now() < this.start + this.length;
  }
  value(now = this.now()) {
    if (now >= this.start + this.length) return this.to;
    if (now <= this.start) return this.from;
    return curve(this.from, this.to, (now - this.start) / this.length);
  }

  /** Moves to `to` in `seconds` (never instantly: an instant jump clicks). */
  fade(to: number, seconds: number) {
    const now = this.now();
    const from = this.value(now);
    const length = Math.max(MUSIC.minFade, seconds);
    this.from = from;
    this.to = to;
    this.start = now;
    this.length = length;
    if (this.param) {
      const p = this.param;
      p.cancelScheduledValues(now);
      p.setValueAtTime(from, now);
      const steps = Math.min(240, Math.max(4, Math.round(length * 30)));
      for (let k = 1; k <= steps; k++) p.linearRampToValueAtTime(curve(from, to, k / steps), now + (length * k) / steps);
    }
    if (!this.param || decks.some((d) => !d.fader.hasParam)) startTicker();
  }
}

// ---------- Decks ----------

type Deck = {
  el: HTMLAudioElement;
  fader: Fader;
  /** Song loaded in this deck (-1: none). */
  index: number;
  /** Ready to start the song at its first note. */
  cued: boolean;
  /** A pause we asked for ourselves (its "pause" event is not the system's). */
  ownPause: boolean;
};

let decks: Deck[] = [];
let active = 0;
let master: Fader | null = null;
const act = () => decks[active];
const idle = () => decks[1 - active];

let ticker: ReturnType<typeof setInterval> | undefined;
/** Without Web Audio: element volume = its deck's volume × the master volume. */
function applyVolumes() {
  const m = master?.value() ?? 0;
  for (const d of decks) if (!d.fader.hasParam) d.el.volume = Math.min(1, Math.max(0, d.fader.value() * m));
  if (ticker && !master?.moving && !decks.some((d) => d.fader.moving)) {
    clearInterval(ticker);
    ticker = undefined;
  }
}
function startTicker() {
  applyVolumes();
  ticker ??= setInterval(applyVolumes, 40);
}

/**
 * Level of a song: the maximum volume chosen in the panel times its own correction, so every song sounds
 * equally loud. A quiet song may need a gain above 1; the analysis keeps its loudest moment under full
 * scale (gain ≤ 0.98/peak today, ≤ 0.98/(0.75·peak) for songs added before the volume setting existed).
 */
const levelOf = (index: number) => {
  const gain = playlist[index]?.gain ?? 1;
  return Math.min(settings.volume * gain, Math.max(1, 0.75 * gain));
};

/** File for this browser; the start offset rides along as a media fragment (#t=), so silence is skipped. */
function srcFor(el: HTMLAudioElement, track: PublicTrack) {
  const source = track.sources.find((s) => !s.type || el.canPlayType(s.type)) ?? track.sources[track.sources.length - 1];
  return track.startAt > 0 ? `${source.src}#t=${track.startAt.toFixed(2)}` : source.src;
}

/** Puts a song in a deck, silent and ready to start at its first note. */
function cue(deck: Deck, index: number) {
  const track = playlist[index];
  const src = srcFor(deck.el, track);
  deck.fader.fade(0, MUSIC.minFade);
  const load = () => {
    deck.el.src = src;
    // Loading drops any "pause" event still queued, so there is no own pause left to wait for.
    deck.ownPause = false;
  };
  // Same song already in the deck (and it loaded fine): just go back to its start. A deck whose
  // load failed is loaded again, so a song can be retried once the connection is back.
  if (deck.index === index && deck.el.getAttribute("src") === src && !deck.el.error) {
    try {
      deck.el.currentTime = track.startAt;
    } catch {
      load();
    }
  } else {
    load();
  }
  deck.index = index;
  deck.cued = true;
}

function stopDeck(deck: Deck) {
  if (!deck.el.paused) {
    deck.ownPause = true;
    deck.el.pause();
  }
}

/** A tiny silent sound, played on the second deck during the first tap: iPhones then let it play later. */
let silence: string | null = null;
function silentWav() {
  if (silence) return silence;
  const n = 800;
  const b = new Uint8Array(44 + n);
  const v = new DataView(b.buffer);
  const text = (at: number, s: string) => [...s].forEach((c, i) => (b[at + i] = c.charCodeAt(0)));
  text(0, "RIFF");
  v.setUint32(4, 36 + n, true);
  text(8, "WAVEfmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true);
  v.setUint32(28, 8000, true);
  v.setUint16(32, 1, true);
  v.setUint16(34, 8, true);
  text(36, "data");
  v.setUint32(40, n, true);
  b.fill(128, 44);
  silence = URL.createObjectURL(new Blob([b], { type: "audio/wav" }));
  return silence;
}
function unlock(deck: Deck) {
  if (deck.el.getAttribute("src")) return;
  deck.el.src = silentWav();
  deck.el
    .play()
    .then(() => {
      if (!deck.cued) stopDeck(deck);
    })
    .catch(() => {});
}

// ---------- Playing ----------

let pauseTimer: ReturnType<typeof setTimeout> | undefined;
let blendTimer: ReturnType<typeof setTimeout> | undefined;
let blending = false;
let hiddenPause = false;
/** Paused by the system (headphones or Bluetooth removed, a call, Siri), not by the guest. */
let systemPaused = false;
/** Each play / pause gets a number, so a play() that finishes loading late can't undo a pause. */
let playSeq = 0;
/** Each change of song gets a number, for the same reason. */
let switchSeq = 0;
/** Songs that failed to load: skipped until the guest presses play again. */
const broken = new Set<number>();

function nextIndex(from: number) {
  for (let k = 1; k <= playlist.length; k++) {
    const i = (from + k) % playlist.length;
    if (!broken.has(i)) return i;
  }
  return -1;
}

function setMediaSession(track: PublicTrack | null) {
  if (!("mediaSession" in navigator) || !track) return;
  try {
    // Without permission to show the song's name, the lock screen only says it is the invitation's music.
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title ?? "Música de la invitación",
      artist: track.title ? (track.artist ?? "") : "XV años de Kelly & Kyara",
      album: "XV años de Kelly & Kyara",
      artwork: [{ src: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    });
    navigator.mediaSession.setActionHandler("play", () => toggleMusic(true));
    navigator.mediaSession.setActionHandler("pause", () => toggleMusic(false));
    navigator.mediaSession.setActionHandler("nexttrack", playlist.length > 1 ? () => nextTrack() : null);
  } catch {
    /* optional */
  }
}

/** Ends a blend now: the outgoing song stops and the new one stays at its level. */
function finishBlend() {
  clearTimeout(blendTimer);
  if (!blending) return;
  blending = false;
  const out = idle();
  stopDeck(out);
  out.fader.fade(0, MUSIC.minFade);
  out.cued = false;
  const a = act();
  if (a.fader.target !== levelOf(a.index)) a.fader.fade(levelOf(a.index), 0.3);
}

/** Blends from the current song into song `index` over `seconds` (the core of every change of song). */
function blendTo(index: number, seconds: number, announce: boolean) {
  finishBlend();
  const outgoing = act();
  const incoming = idle();
  if (!(incoming.cued && incoming.index === index)) cue(incoming, index);
  active = 1 - active;
  blending = true;
  const seq = ++switchSeq;
  update({ index, track: playlist[index], ...(announce ? { announce: Date.now() } : {}) });
  setMediaSession(playlist[index]);
  void ctx?.resume?.();
  incoming.el
    .play()
    .then(() => {
      if (seq !== switchSeq) return;
      broken.clear();
      if (state.status !== "playing" && state.status !== "loading") return; // paused meanwhile
      const length = Math.max(MUSIC.minFade, seconds);
      incoming.fader.fade(levelOf(index), length);
      outgoing.fader.fade(0, length);
      blendTimer = setTimeout(finishBlend, length * 1000 + 120);
      // Coming from a song that failed while starting: the music was still silent.
      if (state.status === "loading") update({ status: "playing" });
      if (master && master.target < 1) master.fade(1, MUSIC.resumeFade);
    })
    .catch(() => {
      if (seq !== switchSeq) return;
      songFailed(incoming);
    });
}

/** A song could not be loaded: it is skipped and the music goes on with the next one. */
function songFailed(deck: Deck) {
  broken.add(deck.index);
  deck.cued = false;
  stopDeck(deck); // a failed load leaves the element "not paused"
  if (deck !== act()) return; // it was only being prepared: it will be skipped when its turn comes
  const previous = idle();
  // (A deck whose own load failed also reads "not paused": `cued` and `error` tell them apart.)
  const previousPlaying =
    blending && state.status === "playing" && previous.cued && !previous.el.error && !previous.el.paused && !previous.el.ended;
  if (previousPlaying) {
    // The song that was playing is still there: it carries on (back at its level), and the next
    // change skips the bad one.
    clearTimeout(blendTimer);
    blending = false;
    deck.fader.fade(0, MUSIC.minFade);
    active = 1 - active;
    previous.fader.fade(levelOf(previous.index), 0.3);
    update({ index: previous.index, track: playlist[previous.index] });
    setMediaSession(playlist[previous.index]);
    return;
  }
  const next = nextIndex(deck.index);
  if (next < 0 || (state.status !== "playing" && state.status !== "loading")) {
    playSeq++;
    finishBlend();
    master?.fade(0, MUSIC.minFade);
    update({ status: "paused" });
    return;
  }
  blendTo(next, MUSIC.minFade, false);
}

function play(fadeSeconds: number, announce: boolean) {
  const deck = act();
  const seq = ++playSeq;
  clearTimeout(pauseTimer);
  // Resumed before a pause finished settling a blend. If the blend had begun, its own timer ends it
  // smoothly; if the new song never started (slow to load), the old one fades out now, so only the
  // new song comes back.
  if (blending && idle().fader.target !== 0) {
    idle().fader.fade(0, 0.3);
    clearTimeout(blendTimer);
    blendTimer = setTimeout(finishBlend, 420);
  }
  systemPaused = false;
  if (!deck.cued) cue(deck, state.index);
  void ctx?.resume?.();
  update({ status: "loading" });
  deck.el
    .play()
    .then(() => {
      if (seq !== playSeq) return; // paused or skipped while it was loading
      broken.clear();
      update({ status: "playing", ...(announce ? { announce: Date.now() } : {}) });
      if (deck.fader.target !== levelOf(deck.index)) deck.fader.fade(levelOf(deck.index), MUSIC.minFade);
      master?.fade(1, fadeSeconds);
    })
    .catch((error: unknown) => {
      if (seq !== playSeq) return;
      // Blocked by the browser (no tap yet): just show it paused. Anything else: the file is the problem.
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        update({ status: "paused" });
        return;
      }
      if (deck === act()) songFailed(deck);
    });
}

function pauseWithFade(seconds: number) {
  if (!decks.length) return;
  playSeq++;
  switchSeq++;
  update({ status: "paused" });
  master?.fade(0, seconds);
  clearTimeout(pauseTimer);
  pauseTimer = setTimeout(() => {
    finishBlend(); // a blend in progress ends here: only the new song remains
    stopDeck(act());
  }, seconds * 1000 + 60);
}

function onTime(deck: Deck) {
  if (deck !== act() || state.status !== "playing" || blending || deck.index < 0) return;
  const track = playlist[deck.index];
  const end = track.endAt ?? deck.el.duration;
  const left = end - deck.el.currentTime;
  if (!Number.isFinite(left)) return;
  // The blend never takes more than a third of the song.
  const blend = Math.min(settings.crossfade, Math.max(0, (end - track.startAt) / 3));
  const next = nextIndex(deck.index) < 0 ? deck.index : nextIndex(deck.index);
  const other = idle();
  if (left <= blend + MUSIC.preload && !(other.cued && other.index === next)) {
    stopDeck(other);
    cue(other, next);
  }
  if (left <= Math.max(blend, 0.05)) blendTo(next, blend, playlist.length > 1);
}

function onEnded(deck: Deck) {
  if (deck !== act() || state.status !== "playing") return;
  const next = nextIndex(deck.index);
  blendTo(next < 0 ? deck.index : next, MUSIC.minFade, playlist.length > 1);
}

/**
 * The system paused it (headphones or Bluetooth removed, a call, Siri): show it paused, without saving
 * "off" (the guest did not choose it). The end of a song also fires "pause" (with ended = true).
 */
function onPause(deck: Deck) {
  if (deck.ownPause) {
    deck.ownPause = false;
    return;
  }
  if (deck !== act() || deck.el.ended || state.status !== "playing") return;
  clearTimeout(pauseTimer);
  playSeq++;
  systemPaused = true;
  finishBlend();
  master?.fade(0, MUSIC.minFade); // already silent: a later play comes back with its fade-in
  update({ status: "paused" });
}

/** The system resumed it by itself (e.g. after a call): show it playing again. */
function onPlaying(deck: Deck) {
  if (deck !== act() || !systemPaused || state.status !== "paused") return;
  systemPaused = false;
  update({ status: "playing" });
  master?.fade(1, MUSIC.resumeFade);
}

function onError(deck: Deck) {
  if (!deck.cued || deck.el.getAttribute("src") === silence) return;
  if (deck === act() && (state.status === "playing" || state.status === "loading")) songFailed(deck);
  else {
    broken.add(deck.index);
    deck.cued = false;
  }
}

function onVisibility() {
  if (document.hidden) {
    if (state.status === "playing" || state.status === "loading") {
      hiddenPause = true;
      pauseWithFade(0.3);
    }
  } else if (hiddenPause) {
    hiddenPause = false;
    play(MUSIC.resumeFade, false);
  }
}

function makeDeck(output: AudioNode | null): Deck {
  const el = new Audio();
  // Songs added from the panel live on Vercel Blob, another origin: without this, Web Audio would play
  // them as silence. Files served by the site itself are not affected.
  el.crossOrigin = "anonymous";
  el.preload = "auto";
  el.setAttribute("playsinline", "");
  let param: AudioParam | null = null;
  if (ctx && output) {
    try {
      const gain = ctx.createGain();
      ctx.createMediaElementSource(el).connect(gain);
      gain.connect(output);
      param = gain.gain;
    } catch {
      param = null;
    }
  }
  const deck: Deck = { el, fader: new Fader(param), index: -1, cued: false, ownPause: false };
  if (!param) el.volume = 0;
  el.addEventListener("timeupdate", () => onTime(deck));
  el.addEventListener("ended", () => onEnded(deck));
  el.addEventListener("pause", () => onPause(deck));
  el.addEventListener("playing", () => onPlaying(deck));
  el.addEventListener("error", () => onError(deck));
  return deck;
}

function setup() {
  if (decks.length) return;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  let output: GainNode | null = null;
  if (AC) {
    try {
      ctx = new AC();
      output = ctx.createGain();
      output.connect(ctx.destination);
    } catch {
      ctx = null;
      output = null;
    }
  }
  master = new Fader(output?.gain ?? null);
  decks = [makeDeck(output), makeDeck(output)];
  active = 0;
  setMediaSession(state.track);

  // iPhone: play like music even with the silent switch on (Safari 16.4+), as a video would.
  const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
  if (session) {
    try {
      session.type = "playback";
    } catch {
      /* older Safari */
    }
  }
  document.addEventListener("visibilitychange", onVisibility);
}

// ---------- What the page calls ----------

/**
 * Called from the "Abrir invitación" tap (it must run inside that gesture). Starts the music (with the
 * rise chosen in the panel), unless the guest paused it on an earlier visit: then the button appears,
 * paused.
 */
export function startMusic() {
  if (state.status !== "idle" || playlist.length === 0 || typeof window === "undefined") return;
  setup();
  // Paused on an earlier visit: nothing plays, not even the silent unlock (on iPhone any sound would
  // interrupt the guest's own music app).
  if (readPref() === "off") {
    update({ status: "paused", announce: Date.now() });
    return;
  }
  unlock(idle());
  play(settings.fadeIn, true);
}

/** Play / pause from the button (or the lock screen); `on` forces a state. The choice is remembered. */
export function toggleMusic(on?: boolean) {
  if (playlist.length === 0) return;
  if (!decks.length) setup();
  const playing = state.status === "playing" || state.status === "loading";
  const want = on ?? !playing;
  hiddenPause = false;
  if (want && !playing) {
    writePref("on");
    unlock(idle()); // within this tap, so the second deck can blend in later (iPhone)
    if (broken.size >= playlist.length) broken.clear(); // every song failed before: try them again
    play(MUSIC.resumeFade, false);
  } else if (!want && playing) {
    writePref("off");
    pauseWithFade(MUSIC.pauseFade);
  }
}

/** Next song (only offered when the playlist has more than one), with a quick blend. */
export function nextTrack() {
  if (!decks.length || playlist.length < 2) return;
  const next = nextIndex(state.index);
  if (next < 0) return;
  const blend = Math.min(Math.max(settings.crossfade, 0.3), MUSIC.skipFade);
  if (state.status === "playing") {
    blendTo(next, blend, true);
    return;
  }
  // Still loading (or paused from the lock screen): change the song in place.
  const wasLoading = state.status === "loading";
  playSeq++;
  switchSeq++; // a song still starting must not report the one picked now as broken
  finishBlend();
  stopDeck(act());
  cue(act(), next);
  update({ index: next, track: playlist[next] });
  setMediaSession(playlist[next]);
  if (wasLoading) play(MUSIC.minFade, true);
}
