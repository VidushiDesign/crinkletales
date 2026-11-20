import { useEffect, useState } from 'react';
import Doodle from '../components/Doodle.jsx';
import { sound } from '../lib/sound.js';

const STEPS = ['reading your day', 'cutting tape', 'finding stickers', 'gluing it down'];

export default function Generating({ onDone }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const per = reduce ? 250 : 520;
    const timers = STEPS.map((_, i) =>
      setTimeout(() => {
        setStep(i);
        i === 1 ? sound.tape() : i === 2 ? sound.sticker() : sound.paper();
      }, i * per),
    );
    const done = setTimeout(onDone, STEPS.length * per + 200);
    return () => {
      timers.forEach(clearTimeout);
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
      </div>
      <p className="gen-step">{STEPS[step]}…</p>
    </div>
  );
}
