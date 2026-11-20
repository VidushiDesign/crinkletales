import { useEffect, useMemo, useState } from 'react';
import { Lock } from 'lucide-react';
import { Press } from '../components/ui.jsx';
import Page from '../components/Page.jsx';
import { generateEntry } from '../lib/generate.js';
import { sound } from '../lib/sound.js';
import { track } from '../lib/track.js';

const DEMO =
  'Took the early flight from Delhi to Goa with Ria. Cold coffee at the airport. I felt so free for the first time in months. Next time I want to stay a whole week.';

const BEATS = [
  { title: 'Talk or type your day', body: 'A meal, a person, a messy feeling. Just say it the way you would to a friend.' },
  { title: 'It becomes a junk page', body: 'Tickets, tape, stickers and doodles, made from what you said.' },
  { title: 'Play with it. Keep it.', body: 'Move things around, add photos, then tuck it into your journal. It stays on your device.' },
];

const TYPED = 'took the early flight to goa with ria…';

export default function Intro({ onDone }) {
  const [beat, setBeat] = useState(0);
  const demo = useMemo(() => generateEntry(DEMO), []);

  useEffect(() => {
    if (beat >= BEATS.length - 1) return;
    const t = setTimeout(() => setBeat((b) => b + 1), 3600);
    return () => clearTimeout(t);
  }, [beat]);

  const next = () => {
    sound.page();
    if (beat < BEATS.length - 1) setBeat(beat + 1);
    else finish('completed');
  };
  const finish = (how) => {
    track('intro_' + how, { beat });
    onDone();
  };

  return (
    <div className="intro">
      <div className="intro-top">
        <div className="logo">
          crinkle<span>tales</span>
        </div>
        {beat < BEATS.length - 1 ? (
          <Press variant="ghost" size="sm" onClick={() => finish('skipped')}>
            Skip
          </Press>
        ) : null}
      </div>

      <div className="intro-stage" key={beat} aria-hidden="true">
        {beat === 0 && (
          <div className="intro-cassette">
            <div className="cassette">
              <div className="cassette-label">
                <span className="rec-dot" /> REC · today
              </div>
              <div className="cassette-reels">
                <span className="reel" />
                <span className="reel" />
              </div>
            </div>
            <div className="intro-bubble">
              {TYPED.split('').map((ch, i) => (
                <span key={i} className="typed" style={{ '--i': i }}>
                  {ch}
                </span>
              ))}
            </div>
          </div>
        )}
        {beat === 1 && (
          <div className="intro-page pop-in-all">
            <Page page={demo.pages[0]} skin="pop" />
          </div>
        )}
        {beat === 2 && (
          <div className="intro-book">
            <div className="book">
              <div className="book-cover">
                <span>my</span>
                crinkletales
              </div>
              <div className="book-page-in">
                <Page page={demo.pages[0]} skin="pop" />
              </div>
            </div>
            <div className="intro-lock">
              <Lock aria-hidden="true" /> private, on this device
            </div>
          </div>
        )}
      </div>

      <div className="intro-copy" key={'c' + beat}>
        <h1>{BEATS[beat].title}</h1>
        <p>{BEATS[beat].body}</p>
      </div>

      <div className="intro-foot">
        <div className="dots" role="tablist" aria-label="Intro steps">
          {BEATS.map((b, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === beat}
              aria-label={`Step ${i + 1}: ${b.title}`}
              className={i === beat ? 'is-active' : ''}
              onClick={() => setBeat(i)}
            />
          ))}
        </div>
        <Press variant="primary" size="lg" sfx="paper" onClick={next}>
          {beat < BEATS.length - 1 ? 'Next' : 'Make my first page'}
        </Press>
      </div>
    </div>
  );
}
