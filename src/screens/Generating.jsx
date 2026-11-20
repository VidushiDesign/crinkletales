import { useEffect, useState } from 'react';
import Doodle from '../components/Doodle.jsx';
import { sound } from '../lib/sound.js';

// Each step has its own ASMR sound, over a bed of soft paper rustles.
const STEPS = [
  ['reading your day', 'rustle'],
  ['snipping paper', 'snip'],
  ['tearing tape', 'tape'],
  ['finding stickers', 'pop'],
  ['stamping the date', 'thunk'],
  ['gluing it down', 'paper'],
];

export default function Generating({ onDone }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const per = reduce ? 220 : 560;
    const timers = STEPS.map(([, sfx], i) =>
      setTimeout(() => {
        setStep(i);
        sound[sfx]();
        if (sfx === 'pop') setTimeout(() => sound.pop(), 160);
      }, i * per),
    );
    const bed = setInterval(() => Math.random() < 0.6 && sound.rustle(), 230);
    const done = setTimeout(onDone, STEPS.length * per + 250);
    return () => {
      timers.forEach(clearTimeout);
      clearInterval(bed);
      clearTimeout(done);
    };
  }, [onDone]);

  return (
    <div className="screen generating" role="status" aria-live="polite">
      <div className="gen-stack" aria-hidden="true">
        <div className="gen-paper" />
        <div className="gen-tape" />
        <div className="gen-sticker s1">
          <Doodle kind="star" />
        </div>
        <div className="gen-sticker s2">
          <Doodle kind="heart" />
        </div>
        <div className="gen-sticker s3">
          <Doodle kind="flower" />
        </div>
        <div className="gen-stamp">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
      </div>
      <p className="gen-step">{STEPS[step][0]}…</p>
    </div>
  );
}
