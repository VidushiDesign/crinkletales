import { useMemo, useState } from 'react';
import { Mic, PenLine, Shuffle, Flame } from 'lucide-react';
import { Press } from '../components/ui.jsx';
import Page, { NoteThumb } from '../components/Page.jsx';
import { PROMPTS, dateLabel } from '../lib/generate.js';
import { streakDays } from './Insights.jsx';

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Up late';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Home({ data, go }) {
  const { entries, settings } = data;
  const [pi, setPi] = useState(() => Math.floor(Math.random() * PROMPTS.length));
  const recent = entries.slice(0, 6);
  const streak = useMemo(() => streakDays(entries), [entries]);
  const writtenToday = entries.some((e) => new Date(e.createdAt).toDateString() === new Date().toDateString());

  return (
    <div className="screen home">
      <header className="home-head">
        <p className="eyebrow">{dateLabel(Date.now())}</p>
        <h1>
          {greeting()}
          {settings.name ? `, ${settings.name}` : ''}.
        </h1>
        {streak > 0 ? (
          <span className="pill pill-mustard">
            <Flame aria-hidden="true" /> {streak} day{streak > 1 ? 's' : ''} of pages
          </span>
        ) : null}
      </header>

      <section className="card card-cta">
        <p className="eyebrow">{writtenToday ? 'one more for today?' : 'today’s page'}</p>
        <h2>Tell me about today.</h2>
        <button
          type="button"
          className="prompt-pill"
          onClick={() => setPi((pi + 1) % PROMPTS.length)}
          aria-label={`Prompt: ${PROMPTS[pi]}. Tap for another.`}
        >
          <Shuffle aria-hidden="true" /> {PROMPTS[pi]}
        </button>
        <div className="cta-row">
          <Press variant="primary" size="lg" sfx="paper" onClick={() => go('capture', { mode: 'talk', prompt: PROMPTS[pi] })}>
            <Mic aria-hidden="true" /> Talk
          </Press>
          <Press size="lg" sfx="paper" onClick={() => go('capture', { mode: 'type', prompt: PROMPTS[pi] })}>
            <PenLine aria-hidden="true" /> Type
          </Press>
        </div>
      </section>

      <section className="home-recent">
        <div className="section-head">
          <h2>Latest pages</h2>
          {entries.length ? (
            <Press variant="ghost" size="sm" onClick={() => go('journal')}>
              See journal
            </Press>
          ) : null}
        </div>
        {recent.length ? (
          <div className="shelf">
            {recent.map((e, i) => (
              <button
                key={e.id}
                type="button"
                className="shelf-item"
                style={{ '--tilt': `${i % 2 ? 2 : -2}deg` }}
                onClick={() => go('entry', { id: e.id })}
              >
                {e.pages.length ? <Page page={e.pages[0]} skin={e.style} /> : <NoteThumb entry={e} />}
                <span className="shelf-cap">{e.title}</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="muted">Your pages will show up here. The first one takes about a minute.</p>
        )}
      </section>
    </div>
  );
}
