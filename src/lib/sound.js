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
};
