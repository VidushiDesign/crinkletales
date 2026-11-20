import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Press, Chip, Empty } from '../components/ui.jsx';
import Page, { NoteThumb } from '../components/Page.jsx';
import { dateLabel } from '../lib/generate.js';
import { sound } from '../lib/sound.js';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'everyday', label: 'Everyday' },
  { id: 'travel', label: 'Travel' },
  { id: 'feelings', label: 'Feelings' },
];

let openedThisSession = false;

export default function Journal({ data, go }) {
  const { entries, settings } = data;
  const [filter, setFilter] = useState('all');
  const [open, setOpen] = useState(openedThisSession);

  useEffect(() => {
    if (openedThisSession) return;
    const t = setTimeout(() => {
      setOpen(true);
      sound.page();
      openedThisSession = true;
    }, 450);
    return () => clearTimeout(t);
  }, []);

  const list = filter === 'all' ? entries : entries.filter((e) => e.theme === filter);
  const count = (id) => (id === 'all' ? entries.length : entries.filter((e) => e.theme === id).length);

  return (
    <div className="screen journal">
      <div className={`cover ${open ? 'is-open' : ''}`}>
        <div className="cover-front" aria-hidden={open}>
          <span className="cover-label">
            {settings.name ? `${settings.name}’s` : 'my'}
            <strong>crinkletales</strong>
          </span>
          <span className="cover-strap" />
        </div>
        <div className="cover-inside">
          <p className="eyebrow">{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</p>
          <h1>{settings.name ? `${settings.name}’s journal` : 'Your journal'}</h1>
        </div>
      </div>

      <div className="chip-row filters" role="toolbar" aria-label="Filter by theme">
        {FILTERS.map((f) => (
          <Chip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label} <small>{count(f.id)}</small>
          </Chip>
        ))}
      </div>

      {list.length ? (
        <div className="entry-grid">
          {list.map((e, i) => (
            <button
              key={e.id}
              type="button"
              className="entry-card"
              style={{ '--i': i }}
              onPointerDown={() => sound.tap()}
              onClick={() => go('entry', { id: e.id })}
            >
              <div className="entry-thumb">
                {e.pages.length ? <Page page={e.pages[0]} skin={e.style} /> : <NoteThumb entry={e} />}
                {e.pages.length > 1 ? <span className="entry-pages">{e.pages.length} pages</span> : null}
              </div>
              <div className="entry-meta">
                <strong>{e.title}</strong>
                <span>
                  {dateLabel(e.createdAt)} · {e.theme}
                </span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <Empty
          title={entries.length ? `No ${filter} pages yet` : 'Your journal is empty'}
          body={entries.length ? 'Pages are sorted by what your story is about.' : 'Tell it about your day and your first page lands here.'}
          action={
            <Press variant="primary" sfx="paper" onClick={() => go('capture', { mode: 'type' })}>
              <Plus aria-hidden="true" /> New page
            </Press>
          }
        />
      )}
    </div>
  );
}
