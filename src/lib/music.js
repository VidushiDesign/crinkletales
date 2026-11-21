// MUSIC
// 1. Background music: loops quietly after the first tap (browsers
//    block sound before that). Pauses while you record, and while an
//    entry's own song plays. Muted from the You screen.
// 2. Entry music: each memory can have a song that plays when opened.
//
// Tracks are either composed in code (gen, see compose.js) or files in
// public/music/ (file: 'music/name.mp3'). Add a file there, then list it here.
import { GenPlayer } from './compose.js';

export const TRACKS = [
  { id: 'calm', title: 'slow morning · soft piano', gen: 'calm' },
  { id: 'dreamy', title: 'cloud nap · dreamy', gen: 'dreamy' },
  { id: 'sunny', title: 'window seat · sunny', gen: 'sunny' },
];

const url = (file) => `${import.meta.env.BASE_URL}${file}`;
export const trackById = (id) => TRACKS.find((t) => t.id === id);

function makePlayer(t, volume) {
  if (t.gen) return new GenPlayer(t.gen, volume);
  const a = new Audio(url(t.file));
  a.volume = volume;
  return a;
}

// ---- background player ----
let bg = null;
let bgIndex = 0;
let bgEnabled = true;
let ducked = 0;
const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn());

function ensureBg() {
  if (bg || !TRACKS.length) return bg;
  bg = makePlayer(TRACKS[bgIndex], 0.2);
  bg.addEventListener('ended', () => bgMusic.next());
  bg.addEventListener('play', emit);
  bg.addEventListener('pause', emit);
  return bg;
}

export const bgMusic = {
  setEnabled(on) {
    bgEnabled = on;
    if (!on) bg?.pause();
    else if (!ducked) this.play();
    emit();
  },
  play() {
    if (!bgEnabled || ducked) return;
    const a = ensureBg();
    a?.play().catch(() => {});
  },
  // something else needs the room (recording, an entry's song): step aside
  duck() {
    ducked++;
    bg?.pause();
  },
  unduck() {
    ducked = Math.max(0, ducked - 1);
    if (!ducked) this.play();
  },
  current: () => (TRACKS.length ? TRACKS[bgIndex] : null),
  isPlaying: () => !!bg && !bg.paused,
  toggle() {
    const a = ensureBg();
    if (!a) return;
    if (a.paused) {
      ducked = 0;
      a.play().catch(() => {});
    } else a.pause();
  },
  next() {
    if (!TRACKS.length) return;
    const wasPlaying = bg && !bg.paused;
    bg?.pause();
    bg = null;
    bgIndex = (bgIndex + 1) % TRACKS.length;
    const a = ensureBg();
    if (wasPlaying && bgEnabled && !ducked) a.play().catch(() => {});
    emit();
  },
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};

// ---- entry song from an in-app track ----
export function playTrack(id) {
  const t = trackById(id);
  if (!t) return null;
  const a = makePlayer(t, 0.4);
  if (!t.gen) a.loop = true;
  a.play().catch(() => {});
  return a;
}

// ---- links pasted by the person ----
export function parseSongLink(raw = '') {
  const s = raw.trim();
  if (!s) return null;
  let m = s.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/);
  if (m) return { kind: 'youtube', id: m[1], url: `https://www.youtube.com/watch?v=${m[1]}` };
  m = s.match(/open\.spotify\.com\/(?:intl-[a-z-]+\/)?(track|album|playlist|episode)\/([A-Za-z0-9]+)/);
  if (m) return { kind: 'spotify', type: m[1], id: m[2], url: `https://open.spotify.com/${m[1]}/${m[2]}` };
  if (/^https?:\/\//.test(s)) return { kind: 'link', url: s };
  return null;
}

export function embedUrl(music) {
  if (music?.kind === 'youtube')
    return `https://www.youtube-nocookie.com/embed/${music.id}?autoplay=1&loop=1&playlist=${music.id}&rel=0&modestbranding=1`;
  if (music?.kind === 'spotify') return `https://open.spotify.com/embed/${music.type}/${music.id}?theme=0`;
  return null;
}
