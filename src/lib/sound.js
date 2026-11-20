// ASMR sounds, synthesised with the Web Audio API.
// No audio files, so no licensing. Each sound is shaped noise.
// Browsers only allow sound after a tap, so the context starts lazily.

let ctx = null;
let enabled = true;
let noise = null;

export function setSoundEnabled(on) {
  enabled = on;
}

function audio() {
  if (!enabled) return null;
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      const len = ctx.sampleRate * 1;
      noise = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

// One burst of filtered noise.
function burst(c, { at = 0, dur = 0.05, type = 'bandpass', freq = 3000, q = 1, gain = 0.3, sweepTo }) {
  const t = c.currentTime + at;
  const src = c.createBufferSource();
  src.buffer = noise;
  src.playbackRate.value = 0.8 + Math.random() * 0.4;
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(freq, t);
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
  f.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.01, dur / 3));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(c.destination);
  src.start(t, Math.random() * 0.5, dur + 0.05);
}

function tone(c, { at = 0, from = 600, to = 200, dur = 0.12, gain = 0.2, type = 'sine' }) {
  const t = c.currentTime + at;
  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(from, t);
  o.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export const sound = {
  // paper crinkle: a cluster of tiny crackles
  paper() {
    const c = audio();
    if (!c) return;
    const n = 7 + Math.floor(Math.random() * 5);
    for (let i = 0; i < n; i++) {
      burst(c, {
        at: i * 0.025 + Math.random() * 0.02,
        dur: 0.02 + Math.random() * 0.04,
        freq: 2000 + Math.random() * 4000,
        q: 2 + Math.random() * 3,
        gain: 0.12 + Math.random() * 0.18,
      });
    }
  },
  // tape rip: rising, sticky noise
  tape() {
    const c = audio();
    if (!c) return;
    burst(c, { dur: 0.32, type: 'bandpass', freq: 900, sweepTo: 5200, q: 4, gain: 0.25 });
    for (let i = 0; i < 6; i++) burst(c, { at: i * 0.05, dur: 0.02, freq: 4500, q: 6, gain: 0.08 });
  },
  // sticker: a soft pop
  sticker() {
    const c = audio();
    if (!c) return;
    tone(c, { from: 520, to: 180, dur: 0.1, gain: 0.25 });
    burst(c, { dur: 0.03, type: 'highpass', freq: 3000, gain: 0.08 });
  },
  // page turn: a low whoosh
  page() {
    const c = audio();
    if (!c) return;
    burst(c, { dur: 0.38, type: 'lowpass', freq: 400, sweepTo: 2600, q: 0.7, gain: 0.3 });
  },
  // tap: tiny click for buttons
  tap() {
    const c = audio();
    if (!c) return;
    burst(c, { dur: 0.018, type: 'highpass', freq: 2500, gain: 0.06 });
  },
  // delete: a short scrunch
  scrunch() {
    const c = audio();
    if (!c) return;
    for (let i = 0; i < 12; i++) {
      burst(c, { at: i * 0.018, dur: 0.03, freq: 1200 + Math.random() * 2500, q: 3, gain: 0.15 });
    }
  },

  // ---- material sounds: every kind of item sounds like what it is ----
  // tape lifting off: sticky crackle that rises
  peel() {
    const c = audio();
    if (!c) return;
    for (let i = 0; i < 9; i++) burst(c, { at: i * 0.016, dur: 0.018, freq: 3000 + i * 300, q: 8, gain: 0.1 });
  },
  // tape pressed down: soft rub
  smooth() {
    const c = audio();
    if (!c) return;
    burst(c, { dur: 0.16, type: 'bandpass', freq: 1400, sweepTo: 900, q: 1.2, gain: 0.14 });
  },
  // ticket / card stock: a crisp flick
  card() {
    const c = audio();
    if (!c) return;
    burst(c, { dur: 0.025, type: 'bandpass', freq: 2200, q: 5, gain: 0.3 });
    tone(c, { from: 260, to: 180, dur: 0.05, gain: 0.08, type: 'triangle' });
  },
  // photo: glossy polaroid sliding
  slide() {
    const c = audio();
    if (!c) return;
    burst(c, { dur: 0.2, type: 'highpass', freq: 5000, sweepTo: 3000, q: 0.5, gain: 0.09 });
  },
  // sticker / doodle: a vinyl peel and pop
  pop() {
    const c = audio();
    if (!c) return;
    burst(c, { dur: 0.04, type: 'highpass', freq: 4000, gain: 0.1 });
    tone(c, { at: 0.03, from: 700, to: 260, dur: 0.09, gain: 0.22 });
  },
  // handwritten note: a light rustle
  rustle() {
    const c = audio();
    if (!c) return;
    for (let i = 0; i < 4; i++) burst(c, { at: i * 0.035, dur: 0.05, freq: 2500 + Math.random() * 1500, q: 1.5, gain: 0.1 });
  },
  // name tag / label: a flat slap
  slap() {
    const c = audio();
    if (!c) return;
    burst(c, { dur: 0.05, type: 'lowpass', freq: 1800, q: 0.8, gain: 0.35 });
  },
  // hanging tag: string flutter
  flutter() {
    const c = audio();
    if (!c) return;
    for (let i = 0; i < 5; i++) burst(c, { at: i * 0.04, dur: 0.03, freq: 1800 - i * 150, q: 2, gain: 0.09 });
  },
  // rubber stamp / date / mood: a soft thunk
  thunk() {
    const c = audio();
    if (!c) return;
    tone(c, { from: 160, to: 70, dur: 0.12, gain: 0.35 });
    burst(c, { dur: 0.03, type: 'lowpass', freq: 900, gain: 0.2 });
  },
  // title: marker squeak
  marker() {
    const c = audio();
    if (!c) return;
    tone(c, { from: 1300, to: 1700, dur: 0.07, gain: 0.05, type: 'sawtooth' });
    burst(c, { dur: 0.08, type: 'bandpass', freq: 3500, q: 6, gain: 0.08 });
  },
  // scissors: two snips
  snip() {
    const c = audio();
    if (!c) return;
    [0, 0.11].forEach((at) => {
      burst(c, { at, dur: 0.02, type: 'highpass', freq: 6000, gain: 0.25 });
      tone(c, { at, from: 2400, to: 1800, dur: 0.03, gain: 0.05, type: 'square' });
    });
  },
  // rotate: a tiny ratchet tick
  tick() {
    const c = audio();
    if (!c) return;
    burst(c, { dur: 0.012, type: 'bandpass', freq: 3800, q: 10, gain: 0.12 });
  },
  // resize: a soft paper stretch
  stretch() {
    const c = audio();
    if (!c) return;
    burst(c, { dur: 0.1, type: 'bandpass', freq: 800, sweepTo: 1600, q: 3, gain: 0.12 });
  },
};

// Which sound each item makes when you pick it up and put it down.
const PICK = {
  tape: 'peel', ticket: 'card', photo: 'slide', doodle: 'pop', note: 'rustle', quote: 'rustle',
  nametag: 'slap', label: 'slap', tag: 'flutter', date: 'thunk', mood: 'thunk', title: 'marker',
};
const DROP = {
  tape: 'smooth', ticket: 'card', photo: 'slide', doodle: 'pop', note: 'paper', quote: 'paper',
  nametag: 'slap', label: 'slap', tag: 'flutter', date: 'thunk', mood: 'thunk', title: 'paper',
};
export const itemSound = {
  pick: (type) => sound[PICK[type] || 'tap'](),
  drop: (type) => sound[DROP[type] || 'paper'](),
  add: (type) => sound[type === 'tape' ? 'tape' : DROP[type] || 'sticker'](),
};
