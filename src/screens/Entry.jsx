import { useState } from 'react';
import { ArrowLeft, Pencil, Trash2, Mail } from 'lucide-react';
import { Press, Confirm } from '../components/ui.jsx';
import Page from '../components/Page.jsx';
import { dateLabel, MOOD_LABEL } from '../lib/generate.js';
import { sound } from '../lib/sound.js';
import { track } from '../lib/track.js';

export default function Entry({ entry, back, go, onDelete }) {
  const [pocket, setPocket] = useState(false);
  const [confirm, setConfirm] = useState(false);

  if (!entry) {
    return (
      <div className="screen">
        <p className="muted">This page isn’t here anymore.</p>
        <Press onClick={back}>Back</Press>
      </div>
    );
  }

  const togglePocket = () => {
    sound.paper();
    if (!pocket) track('pocket_opened');
    setPocket(!pocket);
  };

  return (
    <div className="screen entry">
      <header className="topbar">
        <Press variant="icon" aria-label="Back" onClick={back}>
          <ArrowLeft aria-hidden="true" />
        </Press>
        <div className="topbar-title">
          <strong>{entry.title}</strong>
          <span>{dateLabel(entry.createdAt)}</span>
        </div>
        <Press variant="icon" aria-label="Delete entry" sfx={null} onClick={() => setConfirm(true)}>
          <Trash2 aria-hidden="true" />
        </Press>
      </header>

      <div className="entry-tags">
        <span className="pill">{entry.theme}</span>
        <span className="pill pill-sky">mood: {MOOD_LABEL[entry.mood] || entry.mood}</span>
        <span className="pill pill-butter">{entry.style}</span>
      </div>

      <div className="spread" onScroll={() => {}}>
        {entry.pages.map((p, i) => (
          <div className="spread-page" key={p.id}>
            <Page page={p} skin={entry.style} />
            <span className="spread-num">
              {i + 1} / {entry.pages.length}
            </span>
          </div>
        ))}
      </div>

      <div className="entry-actions">
        <Press variant="primary" size="lg" sfx="paper" onClick={() => go('editor', { id: entry.id })}>
          <Pencil aria-hidden="true" /> Edit pages
        </Press>
      </div>

      <section className={`pocket ${pocket ? 'is-open' : ''}`}>
        <div className="pocket-card" id="pocket-story" aria-hidden={!pocket}>
          <p className="eyebrow">the full story</p>
          <p className="pocket-text">{entry.text}</p>
          <dl className="pocket-meta">
            {entry.people?.length ? (
              <>
                <dt>with</dt>
                <dd>{entry.people.join(', ')}</dd>
              </>
            ) : null}
            {entry.places?.length ? (
              <>
                <dt>where</dt>
                <dd>{entry.places.join(', ')}</dd>
              </>
            ) : null}
            {entry.song ? (
              <>
                <dt>soundtrack</dt>
                <dd>{entry.song}</dd>
              </>
            ) : null}
            <dt>told by</dt>
            <dd>{entry.mode === 'talk' ? 'talking' : 'typing'} · {entry.words} words</dd>
          </dl>
        </div>
        <button
          type="button"
          className="pocket-front"
          aria-expanded={pocket}
          aria-controls="pocket-story"
          onClick={togglePocket}
        >
          <Mail aria-hidden="true" />
          {pocket ? 'tuck it back in' : 'pull out the full story'}
        </button>
      </section>

      <Confirm
        open={confirm}
        title="Throw this page away?"
        body="It’s only saved on this device, so it can’t be brought back."
        confirmLabel="Delete"
        danger
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          onDelete(entry.id);
        }}
      />
    </div>
  );
}
