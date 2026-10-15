/*
 * Background music player (browser only). One player for the whole page, shared by the envelope
 * (which starts it on the "Abrir invitación" tap, the gesture browsers require before sound) and the
 * floating button (MusicButton), which follows its state through subscribe()/getState().
 *
 * Volume goes through the Web Audio API: on iPhone an <audio> element's volume cannot be changed from
 * code, so fades would be impossible. Fades follow a decibel curve, which the ear hears as an even rise.
 * Polite behaviour: the guest's pause is remembered on this device; the music pauses by itself when the
 * page is hidden (another app, locked phone) and comes back with a fade when the guest returns.
 * The songs come from the admin panel (setPlaylist); each one carries its own volume correction and
 * the seconds where its music starts and ends, so silences are skipped.
 */
import { MUSIC, type PublicTrack } from "@/lib/music";

export type MusicStatus = "idle" | "loading" | "playing" | "paused";
export type MusicState = {
  status: MusicStatus;
  index: number;
  track: PublicTrack | null;
  /** Set when the title should be shown for a moment (start, next song, paused by preference). */
  announce: number;
};

const PREF_KEY = "kk-music";
const SILENCE_DB = -45;

const INITIAL: MusicState = { status: "idle", index: 0, track: null, announce: 0 };
let playlist: PublicTrack[] = [];

/** Songs for this page (from the server). Only taken before the music starts. */
export function setPlaylist(tracks: PublicTrack[]) {
  if (state.status !== "idle") return;
  playlist = tracks.filter((t) => t.sources.length > 0);
  state = { ...state, track: playlist[0] ?? null };
}

let state = INITIAL;
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

let audio: HTMLAudioElement | null = null;
let ctx: AudioContext | null = null;
let gain: GainNode | null = null;
let pauseTimer: ReturnType<typeof setTimeout> | undefined;
let volumeTimer: ReturnType<typeof setInterval> | undefined;
let endingFade = false;
let hiddenPause = false;
/** Paused by the system (headphones or Bluetooth removed, a call, Siri), not by the guest. */
let systemPaused = false;
/** Each play / pause / skip gets a number, so a play() that finishes loading late can't undo a pause. */
let playSeq = 0;

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

/**
 * Volume of the current song: the background level times its own correction. Through Web Audio it may
 * go above 1 (a quiet song raised to the common level; the analysis keeps its loudest moment under full
 * scale); an <audio> element's own volume stops at 1.
 */
const songLevel = () => {
  const level = MUSIC.volume * (state.track?.gain ?? 1);
  return gain ? level : Math.min(1, level);
};

const toDb = (g: number) => (g > 0.0001 ? 20 * Math.log10(g) : SILENCE_DB);
const fromDb = (db: number) => 10 ** (db / 20);
const currentLevel = () => (gain ? gain.gain.value : (audio?.volume ?? 0));

/** Moves the volume to `target` in `seconds`, along a decibel curve (even to the ear). */
function fadeTo(target: number, seconds: number) {
  const from = currentLevel();
  const dbFrom = toDb(from);
  const dbTo = toDb(target);
  const level = (t: number) => (t >= 1 ? target : fromDb(dbFrom + (dbTo - dbFrom) * t));
  const steps = Math.max(1, Math.round(seconds * 6));
  if (volumeTimer) clearInterval(volumeTimer);

  if (gain && ctx) {
    const p = gain.gain;
    const now = ctx.currentTime;
    p.cancelScheduledValues(now);
    p.setValueAtTime(from, now);
    for (let k = 1; k <= steps; k++) p.linearRampToValueAtTime(level(k / steps), now + (seconds * k) / steps);
    return;
  }
  // No Web Audio: step the element's volume (works everywhere except iPhone, which has Web Audio).
  if (!audio) return;
  let k = 0;
  volumeTimer = setInterval(() => {
    k++;
    if (audio) audio.volume = Math.min(1, Math.max(0, level(k / steps)));
    if (k >= steps && volumeTimer) clearInterval(volumeTimer);
  }, (seconds * 1000) / steps);
}

/** File for this browser; the start offset rides along as a media fragment (#t=), so silence is skipped. */
function srcFor(track: PublicTrack) {
  const source = track.sources.find((s) => !s.type || audio?.canPlayType(s.type)) ?? track.sources[track.sources.length - 1];
  return track.startAt > 0 ? `${source.src}#t=${track.startAt.toFixed(2)}` : source.src;
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

function load(index: number) {
  if (!audio) return;
  const track = playlist[index];
  endingFade = false;
  if (index === state.index && audio.getAttribute("src")) {
    audio.currentTime = track.startAt;
  } else {
    audio.src = srcFor(track);
  }
  setMediaSession(track);
  update({ index, track });
}

function setup() {
  if (audio) return;
  audio = new Audio();
  // Songs added from the panel live on Vercel Blob, another origin: without this, Web Audio would play
  // them as silence. Files served by the site itself are not affected.
  audio.crossOrigin = "anonymous";
  audio.preload = "auto";
  audio.setAttribute("playsinline", "");
  audio.addEventListener("timeupdate", onTime);
  audio.addEventListener("ended", onEnded);
  audio.addEventListener("pause", onPause);
  audio.addEventListener("playing", onPlaying);

  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (AC) {
    try {
      ctx = new AC();
      gain = ctx.createGain();
      gain.gain.value = 0;
      ctx.createMediaElementSource(audio).connect(gain);
      gain.connect(ctx.destination);
    } catch {
      ctx = null;
      gain = null;
    }
  }
  if (!gain) audio.volume = 0;
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

function play(fadeSeconds: number, announce: boolean) {
  if (!audio) return;
  const seq = ++playSeq;
  clearTimeout(pauseTimer);
  systemPaused = false;
  // A resume in the last seconds must schedule the fade-out again.
  endingFade = false;
  // The song is only downloaded the first time it is played (a guest who keeps it paused never loads it).
  if (!audio.getAttribute("src") && state.track) audio.src = srcFor(state.track);
  void ctx?.resume?.();
  update({ status: "loading" });
  audio
    .play()
    .then(() => {
      if (seq !== playSeq) return; // paused or skipped while it was loading
      update({ status: "playing", ...(announce ? { announce: Date.now() } : {}) });
      fadeTo(songLevel(), fadeSeconds);
    })
    .catch(() => {
      if (seq === playSeq) update({ status: "paused" });
    });
}

function pauseWithFade(seconds: number) {
  if (!audio) return;
  playSeq++;
  fadeTo(0, seconds);
  update({ status: "paused" });
  clearTimeout(pauseTimer);
  pauseTimer = setTimeout(() => audio?.pause(), seconds * 1000 + 60);
}

function onTime() {
  if (!audio || state.status !== "playing") return;
  // Where the music ends: the trailing silence (if any) is never played.
  const end = state.track?.endAt ?? audio.duration;
  const left = end - audio.currentTime;
  if (!Number.isFinite(left)) return;
  if (state.track?.endAt != null && left <= 0.05) {
    onEnded();
    return;
  }
  if (!endingFade && left <= MUSIC.fadeOutEnd) {
    endingFade = true;
    fadeTo(0, Math.max(0.5, left - 0.15));
  }
}

function onEnded() {
  if (state.status !== "playing") return;
  load((state.index + 1) % playlist.length);
  play(MUSIC.fadeInNext, playlist.length > 1);
}

/**
 * The system paused it (headphones or Bluetooth removed, a call, Siri): show it paused, without saving
 * "off" (the guest did not choose it). Our own pauses set the status first, and the end of a song also
 * fires "pause" (with ended = true).
 */
function onPause() {
  if (!audio || audio.ended || state.status !== "playing") return;
  clearTimeout(pauseTimer); // a pending next song must not restart it
  systemPaused = true;
  fadeTo(0, 0.05); // already silent: a later play comes back with its fade-in
  update({ status: "paused" });
}

/** The system resumed it by itself (e.g. after a call): show it playing again. */
function onPlaying() {
  if (!systemPaused || state.status !== "paused") return;
  systemPaused = false;
  update({ status: "playing" });
  fadeTo(songLevel(), MUSIC.resumeFade);
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

/**
 * Called from the "Abrir invitación" tap (it must run inside that gesture). Starts the music with the
 * long fade-in, unless the guest paused it on an earlier visit: then the button appears, paused.
 */
export function startMusic() {
  if (state.status !== "idle" || playlist.length === 0 || typeof window === "undefined") return;
  setup();
  if (readPref() === "off") {
    update({ status: "paused", announce: Date.now() });
    return;
  }
  play(MUSIC.fadeInFirst, true);
}

/** Play / pause from the button (or the lock screen); `on` forces a state. The choice is remembered. */
export function toggleMusic(on?: boolean) {
  if (playlist.length === 0) return;
  if (!audio) setup();
  const playing = state.status === "playing" || state.status === "loading";
  const want = on ?? !playing;
  hiddenPause = false;
  if (want && !playing) {
    writePref("on");
    play(MUSIC.resumeFade, false);
  } else if (!want && playing) {
    writePref("off");
    pauseWithFade(MUSIC.pauseFade);
  }
}

/** Next song (only offered when the playlist has more than one). */
export function nextTrack() {
  if (!audio || playlist.length < 2) return;
  playSeq++;
  fadeTo(0, 0.8);
  clearTimeout(pauseTimer);
  pauseTimer = setTimeout(() => {
    load((state.index + 1) % playlist.length);
    play(MUSIC.fadeInNext, true);
  }, 850);
}
