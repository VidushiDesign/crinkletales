// Renders one junk journal page. Used everywhere: editor, journal
// thumbnails, entry view. Sizes use container units (cqw) so a page
// looks identical at thumbnail size and full screen.

import { Camera } from 'lucide-react';
import Doodle, { MoodFace } from './Doodle.jsx';
import { MOOD_LABEL } from '../lib/generate.js';

export const PAPER_TONES = {
  pop: ['#FFFDF7', '#E8D2AE', '#FBE7A6', '#CFE0FF', '#C8DDB0'],
  japandi: ['#F7F3EC', '#EDE6DA', '#E3D5C1', '#DCE0D3', '#E9DCD3'],
};
export const PAPER_TEXTURES = ['plain', 'grid', 'lined', 'dots'];
const TAPE = {
  pop: ['#F5C431', '#FF5B37', '#8FA8FF', '#C8DDB0', '#FBE7A6'],
  japandi: ['#C9BBA6', '#C9A27E', '#A9B596', '#DCD2C3', '#8E99AD'],
};

function tapeBg(pattern, color) {
  if (pattern === 'stripes')
    return `repeating-linear-gradient(45deg, ${color} 0 6px, rgba(255,255,255,.55) 6px 10px)`;
  if (pattern === 'dots')
    return `radial-gradient(rgba(255,255,255,.7) 22%, transparent 24%) 0 0/10px 10px, ${color}`;
  if (pattern === 'grid')
    return `linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px) 0 0/8px 8px, linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px) 0 0/8px 8px, ${color}`;
  return color;
}

function ItemBody({ it, skin, onPhoto }) {
  const p = it.props || {};
  switch (it.type) {
    case 'title':
      return <h3 className="pi-title">{p.text}</h3>;
    case 'date':
      return <div className="pi-date">{p.text}</div>;
    case 'photo':
      return (
        <div className="pi-photo">
          {p.src ? (
            <img src={p.src} alt="" draggable="false" />
          ) : (
            onPhoto ? (
              <button type="button" className="pi-photo-empty" onClick={onPhoto}>
                <Camera aria-hidden="true" />
                <span>tap to add a photo</span>
              </button>
            ) : (
              <div className="pi-photo-empty">
                <Camera aria-hidden="true" />
                <span>photo goes here</span>
              </div>
            )
          )}
        </div>
      );
    case 'tape': {
      const c = TAPE[skin][(p.color ?? 0) % 5];
      return <div className="pi-tape" style={{ background: tapeBg(p.pattern, c) }} />;
    }
    case 'ticket': {
      const code = (s) => (s || '').slice(0, 3).toUpperCase();
      return (
        <div className="pi-ticket">
          <div className="pi-ticket-head">{skin === 'japandi' ? 'passage' : 'BOARDING PASS'}</div>
          <div className="pi-ticket-route">
            <span>{code(p.from)}</span>
            <i aria-hidden="true">{skin === 'japandi' ? '·' : '→'}</i>
            <span>{code(p.to)}</span>
          </div>
          <div className="pi-ticket-sub">
            {p.from} to {p.to}
          </div>
        </div>
      );
    }
    case 'label':
      return <div className="pi-label">{p.text}</div>;
    case 'nametag':
      return (
        <div className="pi-nametag">
          <div className="pi-nametag-head">{skin === 'japandi' ? 'with' : 'HELLO, with'}</div>
          <div className="pi-nametag-name">{p.name}</div>
          {p.rel ? <div className="pi-nametag-rel">{p.rel}</div> : null}
        </div>
      );
    case 'note':
      return <div className="pi-note">{p.text}</div>;
    case 'quote':
      return <div className="pi-quote">{p.text}</div>;
    case 'tag':
      return (
        <div className="pi-tag">
          <span className="pi-tag-hole" aria-hidden="true" />
          {p.text}
        </div>
      );
    case 'mood':
      return (
        <div className="pi-mood">
          <span className="pi-mood-face">
            <MoodFace mood={p.mood} skin={skin} />
          </span>
          <span>
            <small>mood</small>
            {MOOD_LABEL[p.mood] || p.mood}
          </span>
        </div>
      );
    case 'doodle':
      return <Doodle kind={p.kind} skin={skin} />;
    default:
      return null;
  }
}

// Skipped-page entries: just the words on lined paper.
export function NoteThumb({ entry, full = false }) {
  return (
    <div className={`note-thumb ${full ? 'is-full' : ''}`}>
      <p>{full ? entry.text : entry.text.slice(0, 160)}</p>
      <span className="note-thumb-tag">no page</span>
    </div>
  );
}

export default function Page({
  page,
  skin = 'pop',
  editable = false,
  selectedId = null,
  onItemPointerDown,
  onItemDoubleTap,
  onPhoto,
  onBackgroundPointerDown,
  renderSelection,
  className = '',
  children,
}) {
  const tone = PAPER_TONES[skin][(page.paper?.tone ?? 0) % 5];
  const texture = page.paper?.texture || 'plain';
  const items = [...page.items].sort((a, b) => (a.z || 0) - (b.z || 0));
  return (
    <div
      className={`page skin-${skin} tex-${texture} ${editable ? 'is-editable' : ''} ${className}`}
      style={{ backgroundColor: tone }}
      onPointerDown={editable ? onBackgroundPointerDown : undefined}
    >
      {items.map((it) => (
        <div
          key={it.id}
          className={`pi pi--${it.type} ${selectedId === it.id ? 'is-selected' : ''}`}
          style={{
            left: `${it.x}%`,
            top: `${it.y}%`,
            width: `${it.w}%`,
            transform: `rotate(${it.rot || 0}deg)`,
            zIndex: it.z || 1,
          }}
          onPointerDown={editable ? (e) => onItemPointerDown?.(e, it) : undefined}
          onDoubleClick={editable ? () => onItemDoubleTap?.(it) : undefined}
          data-font={it.props?.font || undefined}
          data-id={it.id}
        >
          <ItemBody it={it} skin={skin} onPhoto={editable && onPhoto ? () => onPhoto(it) : undefined} />
          {selectedId === it.id && renderSelection ? renderSelection(it) : null}
        </div>
      ))}
      {children}
    </div>
  );
}
