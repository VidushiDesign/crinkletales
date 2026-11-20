import { useEffect, useMemo } from 'react';
import { MessageCircleQuestion, CalendarDays, Gift, Lock } from 'lucide-react';
import { MoodFace } from '../components/Doodle.jsx';
import { Press } from '../components/ui.jsx';
import { MOOD_LABEL } from '../lib/generate.js';
import { track } from '../lib/track.js';

const dayKey = (ts) => new Date(ts).toDateString();

export function streakDays(entries) {
  const days = new Set(entries.map((e) => dayKey(e.createdAt)));
  let n = 0;
  const d = new Date();
  if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1);
  while (days.has(d.toDateString())) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

function topOf(list) {
  const c = {};
  list.forEach((x) => x && (c[x] = (c[x] || 0) + 1));
  return Object.entries(c).sort((a, b) => b[1] - a[1])[0] || null;
}

// One plain, kind observation. Never a diagnosis.
export function insightLine(entries) {
  if (entries.length < 2) return null;
  const person = topOf(entries.flatMap((e) => e.people || []));
  if (person && person[1] >= 2) return `${person[0]} shows up in ${person[1]} of your pages. Good people make good pages.`;
  const byTheme = {};
  entries.forEach((e) => (byTheme[e.theme] = [...(byTheme[e.theme] || []), e.words || 0]));
  const avg = Object.entries(byTheme)
    .map(([t, w]) => [t, Math.round(w.reduce((a, b) => a + b, 0) / w.length), w.length])
    .sort((a, b) => b[1] - a[1]);
  if (avg.length > 1) return `Your ${avg[0][0]} pages are your longest, about ${avg[0][1]} words each.`;
  const mood = topOf(entries.map((e) => e.mood).filter((m) => m !== 'meh'));
  if (mood) return `Lately your pages lean ${MOOD_LABEL[mood[0]]}. Worth noticing what those days had in common.`;
  return `You’ve kept ${entries.length} pages so far. Small days count too.`;
}

export default function Insights({ data, go }) {
  const { entries } = data;
  useEffect(() => track('insights_viewed', { entries: entries.length }), [entries.length]);

  const stats = useMemo(() => {
    const themes = { everyday: 0, travel: 0, feelings: 0 };
    entries.forEach((e) => (themes[e.theme] = (themes[e.theme] || 0) + 1));
    const mood = topOf(entries.map((e) => e.mood).filter((m) => m && m !== 'meh'));
    return { themes, mood: mood ? mood[0] : 'meh', streak: streakDays(entries), line: insightLine(entries) };
  }, [entries]);

  const total = Math.max(1, entries.length);

  return (
    <div className="screen insights">
      <header className="page-head">
        <p className="eyebrow">noticed, not judged</p>
        <h1>Insights</h1>
      </header>

      {entries.length < 2 ? (
        <section className="card insight-card is-locked">
          <Lock aria-hidden="true" />
          <h2>Two pages in, your first insight appears.</h2>
          <p className="muted">
            {entries.length === 1 ? 'One more to go.' : 'Start with today.'} Everything is worked out on this device.
          </p>
          <Press variant="primary" sfx="paper" onClick={() => go('capture', { mode: 'type' })}>
            Write a page
          </Press>
        </section>
      ) : (
        <section className="card insight-card">
          <div className="insight-top">
            <span className="insight-face">
              <MoodFace mood={stats.mood} />
            </span>
            <div>
              <p className="eyebrow">this is what your pages say</p>
              <h2>{stats.line}</h2>
            </div>
          </div>
          <div className="insight-stats">
            <div>
              <strong>{entries.length}</strong>
              <span>{entries.length === 1 ? 'entry' : 'entries'}</span>
            </div>
            <div>
              <strong>{stats.streak}</strong>
              <span>day streak</span>
            </div>
            <div>
              <strong>{MOOD_LABEL[stats.mood]}</strong>
              <span>most common mood</span>
            </div>
          </div>
          <div className="theme-bar" role="img" aria-label={`Everyday ${stats.themes.everyday}, travel ${stats.themes.travel}, feelings ${stats.themes.feelings}`}>
            {['everyday', 'travel', 'feelings'].map((t) =>
              stats.themes[t] ? (
                <span key={t} className={`tb-${t}`} style={{ flex: stats.themes[t] / total }}>
                  {t} {stats.themes[t]}
                </span>
              ) : null,
            )}
          </div>
        </section>
      )}

      <p className="eyebrow soon-label">coming soon</p>
      <div className="soon-grid">
        <div className="soon">
          <MessageCircleQuestion aria-hidden="true" />
          <strong>Ask your journal</strong>
          <span>“When was I happiest this month?”</span>
        </div>
        <div className="soon">
          <CalendarDays aria-hidden="true" />
          <strong>Mood calendar</strong>
          <span>Every day as a little sticker.</span>
        </div>
        <div className="soon">
          <Gift aria-hidden="true" />
          <strong>Year wrap-up</strong>
          <span>Your year, as a zine.</span>
        </div>
      </div>
    </div>
  );
}
