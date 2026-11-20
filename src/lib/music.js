// MUSIC
// 1. Background music: loops quietly after the first tap (browsers
//    block sound before that). Muted from the You screen.
// 2. Entry music: each memory can have a song that plays when opened.
//
// Tracks live in public/music/. Add a file there, then list it here.
export const TRACKS = [
  // { id: 'cozy', title: 'cozy afternoon', file: 'music/cozy.mp3', mood: 'calm' },
];

const url = (file) => `${import.meta.env.BASE_URL}${file}`;
export const trackById = (id) => TRACKS.find((t) => t.id === id);

// ---- background player ----
let bg = null;
let bgIndex = 0;
let bgEnabled = true;
let ducked = 0;

function ensureBg() {
  if (bg || !TRACKS.length) return bg;
  bg = new Audio(url(TRACKS[bgIndex].file));
  bg.volume = 0.22;
  bg.addEventListener('ended', () => {
    bgIndex = (bgIndex + 1) % TRACKS.length;
    bg.src = url(TRACKS[bgIndex].file);
    bg.play().catch(() => {});
  });
  return bg;
}

export const bgMusic = {
  setEnabled(on) {
    bgEnabled = on;
    if (!on) bg?.pause();
    else if (!ducked) this.play();
  },
  play() {
    if (!bgEnabled || ducked) return;
    const a = ensureBg();
    a?.play().catch(() => {});
  },
  // an entry's own song is playing: step aside
  duck() {
    ducked++;
    bg?.pause();
  },
  unduck() {
    ducked = Math.max(0, ducked - 1);
    if (!ducked) this.play();
  },
  current: () => (TRACKS.length ? TRACKS[bgIndex] : null),
};

// ---- entry song from an in-app track ----
export function playTrack(id) {
  const t = trackById(id);
  if (!t) return null;
  const a = new Audio(url(t.file));
  a.loop = true;
  a.volume = 0.5;
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
