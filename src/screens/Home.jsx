// HOME (v4 "B, calmer"): greeting, today's page card, this week's moods,
// a memory resurfacing, and the latest pages shelf.
import { useMemo, useState } from 'react';
import { Mic, PenLine, Shuffle, Plus } from 'lucide-react';
import { Press } from '../components/ui.jsx';
import Page, { NoteThumb } from '../components/Page.jsx';
import { MoodFace } from '../components/Doodle.jsx';
import { PROMPTS, dateLabel, detect, splitSentences, MOOD_LABEL } from '../lib/generate.js';
import { streakDays } from './Insights.jsx';

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Up late';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const MOOD_FILL = {
  happy: '#F5C431', excited: '#F5C431', proud: '#F5C431', loved: '#FFB3A1', grateful: '#C8DDB0',
  calm: '#C8DDB0', tired: '#E3D5C1', anxious: '#FBE7A6', sad: '#CFE0FF', meh: '#FFFDF7',
};
const DAY = 86400000;
const startOfDay = (t) => new Date(new Date(t).toDateString()).getTime();

function weekDays(entries) {
  const today = startOfDay(Date.now());
  const dow = (new Date(today).getDay() + 6) % 7; // Monday = 0
  const monday = today - dow * DAY;
  return Array.from({ length: 7 }, (_, i) => {
    const t = monday + i * DAY;
    const entry = entries.find((e) => startOfDay(e.createdAt) === t);
    return {
      t,
      label: new Date(t).toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase(),
      entry,
      isToday: t === today,
      isFuture: t > today,
    };
  });
}

// A memory to resurface: exactly a year ago, or else one from over a week ago.
function memoryFor(entries) {
  const now = new Date();
  const yearAgo = entries.find((e) => {
    const d = new Date(e.createdAt);
    return d.getFullYear() < now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  });
  const pick = yearAgo || entries.filter((e) => Date.now() - e.createdAt > 7 * DAY).sort((a, b) => a.createdAt - b.createdAt)[0];
  if (!pick) return null;
  const days = Math.round((Date.now() - pick.createdAt) / DAY);
  const when = yearAgo ? `on this day · ${now.getFullYear() - new Date(pick.createdAt).getFullYear()} year ago` : `${days} days ago`;
  const line = detect(pick.text).quote || splitSentences(pick.text)[0] || '';
  return { entry: pick, when, line: line.length > 110 ? line.slice(0, 108) + '…' : line };
}

export default function Home({ data, go }) {
  const { entries, settings } = data;
  const [pi, setPi] = useState(() => Math.floor(Math.random() * PROMPTS.length));
  const recent = entries.slice(0, 6);
  const streak = useMemo(() => streakDays(entries), [entries]);
  const week = useMemo(() => weekDays(entries), [entries]);
  const memory = useMemo(() => memoryFor(entries), [entries]);

  return (
    <div className="screen home">
      <header className="home-head">
        <div className="chip-row">
          <span className="pill">{dateLabel(Date.now())}</span>
          {streak > 0 ? (
            <span className="pill pill-mustard">
              {streak} day streak
            </span>
          ) : null}
        </div>
        <h1>
          {greeting()},{' '}
          <span className="hl">{settings.name ? `${settings.name}.` : 'you.'}</span>
        </h1>
      </header>

      <div className="home-grid">
        <section className="card card-cta">
          <span className="washi" aria-hidden="true" />
          <p className="eyebrow">today’s page</p>
          <h2>Tell me about today.</h2>
          <button
            type="button"
            className="prompt-pill"
            onClick={() => setPi((pi + 1) % PROMPTS.length)}
            aria-label={`Prompt: ${PROMPTS[pi]}. Tap for another.`}
          >
            <Shuffle aria-hidden="true" /> <span className="prompt-text">{PROMPTS[pi]}</span>
            <span className="prompt-new">new prompt</span>
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

        <div className="home-side">
          <section className="card week">
            <h2>This week</h2>
            <div className="week-row">
              {week.map((d) => (
                <div key={d.t} className={`week-day ${d.isToday ? 'is-today' : ''} ${d.isFuture ? 'is-future' : ''}`}>
                  <span>{d.label.slice(0, 3)}</span>
                  {d.entry ? (
                    <button
                      type="button"
                      className="week-face"
                      aria-label={`${d.label}: ${d.entry.title}, ${MOOD_LABEL[d.entry.mood] || d.entry.mood}`}
                      onClick={() => go('entry', { id: d.entry.id })}
                    >
                      <MoodFace mood={d.entry.mood} fill={MOOD_FILL[d.entry.mood]} />
                    </button>
                  ) : d.isToday ? (
                    <button
                      type="button"
                      className="week-add"
                      aria-label="Write today's page"
                      onClick={() => go('capture', { mode: 'type', prompt: PROMPTS[pi] })}
                    >
                      <Plus aria-hidden="true" />
                    </button>
                  ) : (
                    <span className="week-empty" aria-hidden="true" />
                  )}
                </div>
              ))}
            </div>
          </section>

          {memory ? (
            <button type="button" className="card memory" onClick={() => go('entry', { id: memory.entry.id })}>
              <span className="memory-thumb">
                {memory.entry.pages.length ? (
                  <Page page={memory.entry.pages[0]} skin={memory.entry.style} />
                ) : (
                  <NoteThumb entry={memory.entry} />
                )}
              </span>
              <span className="memory-text">
                <span className="eyebrow">{memory.when}</span>
                <strong>{memory.entry.title}</strong>
                {memory.line ? <span className="memory-line">“{memory.line}”</span> : null}
              </span>
            </button>
          ) : (
            <section className="card memory is-empty">
              <span className="memory-text">
                <span className="eyebrow">on this day</span>
                <strong>Your memories will resurface here.</strong>
                <span className="memory-line">Keep a few pages and they’ll come back to say hi.</span>
              </span>
            </section>
          )}
        </div>
      </div>

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
                style={{ '--tilt': `${i % 2 ? 1 : -1}deg` }}
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
