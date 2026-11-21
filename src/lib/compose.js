// AMBIENT MUSIC, COMPOSED IN CODE
// Soft pads + piano-like plucks + a bass note + faint vinyl crackle,
// generated live with the Web Audio API. No files, no licences.
// Each "piece" is a chord loop with its own tempo and feel.

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

export const PIECES = {
  calm: {
    // Fmaj7 · Em7 · Dm7 · Cmaj7
    chords: [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]],
    beat: 1.0, // seconds per beat
    beatsPerChord: 4,
    pluck: 0.55, // chance of a note each half beat
    padCut: 900,
  },
  dreamy: {
    // Am9 · Fmaj7 · Cmaj7 · G6
    chords: [[45, 52, 55, 59], [41, 48, 52, 57], [48, 52, 55, 59], [43, 50, 52, 59]],
    beat: 1.25,
    beatsPerChord: 4,
    pluck: 0.35,
    padCut: 700,
  },
  sunny: {
    // C · G/B · Am7 · Fmaj7
    chords: [[48, 52, 55, 60], [47, 50, 55, 59], [45, 52, 55, 60], [41, 48, 52, 57]],
    beat: 0.8,
    beatsPerChord: 4,
    pluck: 0.75,
    padCut: 1300,
  },
};

let ctx = null;
function getCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function impulse(c, seconds = 2.8) {
  const len = c.sampleRate * seconds;
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
  }
  return buf;
}

// Behaves like an <audio> element: play(), pause(), .paused, .volume
export class GenPlayer {
  constructor(pieceId = 'calm', volume = 0.22) {
    this.piece = PIECES[pieceId] || PIECES.calm;
    this.paused = true;
    this._volume = volume;
    this.timer = null;
    this.listeners = {};
  }
  addEventListener(type, fn) {
    (this.listeners[type] ||= []).push(fn);
  }
  _emit(type) {
    (this.listeners[type] || []).forEach((fn) => fn());
  }
  set volume(v) {
    this._volume = v;
    if (this.master && ctx) this.master.gain.setTargetAtTime(v, ctx.currentTime, 0.3);
  }
  get volume() {
    return this._volume;
  }

  _build(c) {
    this.master = c.createGain();
    this.master.gain.value = 0.0001;
    this.master.connect(c.destination);
    this.reverb = c.createConvolver();
    this.reverb.buffer = impulse(c);
    this.wet = c.createGain();
    this.wet.gain.value = 0.55;
    this.reverb.connect(this.wet).connect(this.master);
    this.dry = c.createGain();
    this.dry.gain.value = 0.7;
    this.dry.connect(this.master);
    // vinyl crackle bed
    const len = c.sampleRate * 2;
    const nb = c.createBuffer(1, len, c.sampleRate);
    const d = nb.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() < 0.0009 ? (Math.random() * 2 - 1) * 0.9 : (Math.random() * 2 - 1) * 0.04;
    this.crackle = c.createBufferSource();
    this.crackle.buffer = nb;
    this.crackle.loop = true;
    const hp = c.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2500;
    const cg = c.createGain();
    cg.gain.value = 0.05;
    this.crackle.connect(hp).connect(cg).connect(this.master);
    this.crackle.start();
  }

  _pad(c, notes, t, dur) {
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = this.piece.padCut;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.035, t + dur * 0.3);
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 1.2);
    lp.connect(g);
    g.connect(this.dry);
    g.connect(this.reverb);
    notes.forEach((n) => {
      [-6, 6].forEach((det) => {
        const o = c.createOscillator();
        o.type = 'triangle';
        o.frequency.value = midi(n);
        o.detune.value = det;
        o.connect(lp);
        o.start(t);
        o.stop(t + dur + 1.3);
      });
    });
  }

  _pluck(c, n, t, gain = 0.07) {
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
    g.connect(this.dry);
    g.connect(this.reverb);
    [
      ['sine', 1, 1],
      ['triangle', 2, 0.25],
      ['sine', 3, 0.08],
    ].forEach(([type, mult, amt]) => {
      const o = c.createOscillator();
      o.type = type;
      o.frequency.value = midi(n) * mult;
      const og = c.createGain();
      og.gain.value = amt;
      o.connect(og).connect(g);
      o.start(t);
      o.stop(t + 2.3);
    });
  }

  _bass(c, n, t, dur) {
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.value = midi(n - 12);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.09, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.dry);
    o.start(t);
    o.stop(t + dur + 0.1);
  }

  _schedule() {
    const c = ctx;
    const p = this.piece;
    const chordLen = p.beat * p.beatsPerChord;
    while (this.next < c.currentTime + 1.2) {
      const chord = p.chords[this.step % p.chords.length];
      const t = this.next;
      this._pad(c, chord, t, chordLen);
      this._bass(c, chord[0], t, chordLen * 0.9);
      for (let h = 0; h < p.beatsPerChord * 2; h++) {
        if (Math.random() < p.pluck) {
          const n = chord[Math.floor(Math.random() * chord.length)] + (Math.random() < 0.7 ? 12 : 24);
          this._pluck(c, n, t + h * (p.beat / 2) + Math.random() * 0.03, 0.04 + Math.random() * 0.04);
        }
      }
      this.next += chordLen;
      this.step++;
    }
  }

  play() {
    const c = getCtx();
    if (!c) return Promise.resolve();
    if (!this.master) this._build(c);
    if (!this.paused) return Promise.resolve();
    this.paused = false;
    this.master.gain.cancelScheduledValues(c.currentTime);
    this.master.gain.setTargetAtTime(this._volume, c.currentTime, 0.8);
    this.next = c.currentTime + 0.1;
    this.step = this.step || 0;
    this._schedule();
    this.timer = setInterval(() => this._schedule(), 250);
    this._emit('play');
    return Promise.resolve();
  }

  pause() {
    if (this.paused) return;
    this.paused = true;
    clearInterval(this.timer);
    if (ctx && this.master) {
      this.master.gain.cancelScheduledValues(ctx.currentTime);
      this.master.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.4);
    }
    this._emit('pause');
  }
}
