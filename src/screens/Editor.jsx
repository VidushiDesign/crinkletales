// THE EDITOR: a FigJam-style canvas, but only inside the journal page.
// Select, drag, rotate, resize, layer, delete. Changes autosave.

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft, Undo2, Redo2, Volume2, VolumeX, Check, Sticker, Scissors, PenLine, ImagePlus,
  StickyNote, Palette, Pencil, BringToFront, Copy, Trash2, Plus,
} from 'lucide-react';
import Page, { PAPER_TONES, PAPER_TEXTURES } from '../components/Page.jsx';
import Doodle, { DOODLE_KINDS } from '../components/Doodle.jsx';
import { Press, Sheet, Chip } from '../components/ui.jsx';
import { sound, itemSound } from '../lib/sound.js';
import { uid } from '../lib/storage.js';
import { dateLabel } from '../lib/generate.js';
import { fileToSmallDataUrl } from '../lib/image.js';
import { track } from '../lib/track.js';

const TEXT_TYPES = ['title', 'note', 'quote', 'tag', 'label', 'nametag', 'date', 'ticket'];
const FONT_TYPES = ['title', 'note', 'quote', 'tag', 'label'];
const FONTS = [
  { id: 'hand', label: 'handwritten' },
  { id: 'type', label: 'typewriter' },
  { id: 'label', label: 'LABEL' },
  { id: 'big', label: 'BIG' },
];
const TAPE_PATTERNS = ['stripes', 'dots', 'grid', 'plain'];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);

function textOf(it) {
  const p = it.props || {};
  if (it.type === 'nametag') return p.name || '';
  if (it.type === 'ticket') return `${p.from || ''} to ${p.to || ''}`;
  return p.text || '';
}
function withText(it, text) {
  if (it.type === 'nametag') return { ...it.props, name: text };
  if (it.type === 'ticket') {
    const [from, to] = text.split(/\s+to\s+/i);
    return { ...it.props, from: (from || '').trim(), to: (to || '').trim() };
  }
  return { ...it.props, text };
}

export default function Editor({ entry: initial, onSave, onDone, soundOn, setSoundOn }) {
  const [entry, setEntry] = useState(initial);
  const [pi, setPi] = useState(0);
  const [sel, setSel] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [editing, setEditing] = useState(null); // { id, text, font }
  const [hint, setHint] = useState(true);
  const past = useRef([]);
  const future = useRef([]);
  const [, force] = useState(0);
  const entryRef = useRef(entry);
  const pageRef = useRef(null);
  const drag = useRef(null);
  const lastTap = useRef({ id: null, t: 0 });
  const fileRef = useRef(null);
  const photoTarget = useRef(null);

  entryRef.current = entry;
  const page = entry.pages[pi];
  const skin = entry.style;
  const selected = page.items.find((i) => i.id === sel) || null;

  useEffect(() => {
    const t = setTimeout(() => setHint(false), 5000);
    return () => clearTimeout(t);
  }, []);

  // ---- history ----
  const commit = useCallback(
    (next, before = entryRef.current) => {
      past.current.push(before);
      if (past.current.length > 60) past.current.shift();
      future.current = [];
      const stamped = { ...next, updatedAt: Date.now() };
      setEntry(stamped);
      onSave(stamped);
      force((n) => n + 1);
    },
    [onSave],
  );
  const undo = () => {
    const prev = past.current.pop();
    if (!prev) return;
    future.current.push(entryRef.current);
    setEntry(prev);
    onSave(prev);
    setSel(null);
    sound.paper();
    force((n) => n + 1);
  };
  const redo = () => {
    const nxt = future.current.pop();
    if (!nxt) return;
    past.current.push(entryRef.current);
    setEntry(nxt);
    onSave(nxt);
    sound.paper();
    force((n) => n + 1);
  };

  const mapItems = (e, fn) => ({
    ...e,
    pages: e.pages.map((p, i) => (i === pi ? { ...p, items: fn(p.items) } : p)),
  });
  const patchItem = (e, id, patch) => mapItems(e, (items) => items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const maxZ = () => Math.max(1, ...page.items.map((i) => i.z || 1));

  // ---- drag / rotate / resize ----
  useEffect(() => {
    const move = (ev) => {
      const d = drag.current;
      if (!d) return;
      const dxPx = ev.clientX - d.sx;
      const dyPx = ev.clientY - d.sy;
      if (Math.abs(dxPx) + Math.abs(dyPx) > 3) d.moved = true;
      if (!d.moved) return;
      ev.preventDefault();
      let patch;
      if (d.mode === 'move') {
        patch = {
          x: clamp(d.orig.x + (dxPx / d.rect.width) * 100, -10, 98),
          y: clamp(d.orig.y + (dyPx / d.rect.height) * 100, -6, 98),
        };
      } else if (d.mode === 'rotate') {
        const a = (Math.atan2(ev.clientY - d.cy, ev.clientX - d.cx) * 180) / Math.PI;
        let rot = d.orig.rot + (a - d.a0);
        rot = ((rot + 540) % 360) - 180;
        if (Math.abs(rot) < 3) rot = 0;
        const notch = Math.round(rot / 10);
        if (notch !== d.notch) {
          d.notch = notch;
          sound.tick();
        }
        patch = { rot: Math.round(rot) };
      } else {
        const dist = Math.hypot(ev.clientX - d.cx, ev.clientY - d.cy);
        const w = clamp(d.orig.w * (dist / d.d0), 6, 96);
        patch = { w, x: d.orig.x - (w - d.orig.w) / 2 };
      }
      setEntry((e) => patchItem(e, d.id, patch));
    };
    const up = () => {
      const d = drag.current;
      drag.current = null;
      if (d && d.moved) {
        commit(entryRef.current, d.before);
        if (d.mode === 'move') itemSound.drop(d.type);
        else if (d.mode === 'scale') sound.stretch();
        else sound.tick();
        track('editor_' + d.mode);
      }
    };
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [commit, pi]);

  const startDrag = (ev, it, mode) => {
    ev.stopPropagation();
    const rect = pageRef.current.getBoundingClientRect();
    const el = pageRef.current.querySelector(`[data-id="${it.id}"]`);
    const r = el ? el.getBoundingClientRect() : rect;
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    drag.current = {
      mode,
      id: it.id,
      type: it.type,
      notch: Math.round((it.rot || 0) / 10),
      sx: ev.clientX,
      sy: ev.clientY,
      rect,
      cx,
      cy,
      a0: (Math.atan2(ev.clientY - cy, ev.clientX - cx) * 180) / Math.PI,
      d0: Math.max(10, Math.hypot(ev.clientX - cx, ev.clientY - cy)),
      orig: { x: it.x, y: it.y, rot: it.rot || 0, w: it.w },
      before: entryRef.current,
      moved: false,
    };
  };

  const onItemPointerDown = (ev, it) => {
    if (ev.button && ev.button !== 0) return;
    const now = Date.now();
    if (lastTap.current.id === it.id && now - lastTap.current.t < 320 && TEXT_TYPES.includes(it.type)) {
      lastTap.current = { id: null, t: 0 };
      openEdit(it);
      return;
    }
    lastTap.current = { id: it.id, t: now };
    itemSound.pick(it.type);
    setSel(it.id);
    setHint(false);
    startDrag(ev, it, 'move');
  };

  // ---- actions ----
  const addItem = (type, props, w, extra = {}) => {
    const it = {
      id: uid(),
      type,
      x: clamp(50 - w / 2 + rand(-8, 8), 2, 90),
      y: clamp(38 + rand(-10, 10), 2, 88),
      w,
      rot: Math.round(rand(-8, 8)),
      z: maxZ() + 1,
      props,
      ...extra,
    };
    commit(mapItems(entry, (items) => [...items, it]));
    setSel(it.id);
    setSheet(null);
    itemSound.add(type);
    track('editor_add', { type });
    return it;
  };
  const remove = () => {
    if (!selected) return;
    sound.scrunch();
    commit(mapItems(entry, (items) => items.filter((i) => i.id !== selected.id)));
    setSel(null);
    track('editor_delete', { type: selected.type });
  };
  const forward = () => {
    if (!selected) return;
    sound.tap();
    commit(patchItem(entry, selected.id, { z: maxZ() + 1 }));
  };
  const duplicate = () => {
    if (!selected) return;
    sound.sticker();
    const copy = { ...selected, id: uid(), x: selected.x + 4, y: selected.y + 4, z: maxZ() + 1 };
    commit(mapItems(entry, (items) => [...items, copy]));
    setSel(copy.id);
  };
  const openEdit = (it) => {
    setSel(it.id);
    setEditing({ id: it.id, type: it.type, text: textOf(it), font: it.props?.font || null });
  };
  const saveEdit = () => {
    const it = page.items.find((i) => i.id === editing.id);
    if (it) {
      const props = withText(it, editing.text.trim() || textOf(it));
      if (FONT_TYPES.includes(it.type)) props.font = editing.font || undefined;
      commit(patchItem(entry, it.id, { props }));
      sound.paper();
      track('editor_text');
    }
    setEditing(null);
  };

  const pickPhoto = (target) => {
    photoTarget.current = target ? target.id : null;
    fileRef.current?.click();
  };
  const onFile = async (ev) => {
    const f = ev.target.files?.[0];
    ev.target.value = '';
    if (!f) return;
    try {
      const src = await fileToSmallDataUrl(f);
      const target = page.items.find((i) => i.id === photoTarget.current);
      if (target) commit(patchItem(entry, target.id, { props: { ...target.props, src } }));
      else addItem('photo', { src }, 44);
      sound.slide();
      track('editor_photo');
    } catch {
      /* unreadable image: ignore */
    }
  };

  const setPaper = (patch) => {
    sound.paper();
    commit({
      ...entry,
      pages: entry.pages.map((p, i) => (i === pi ? { ...p, paper: { ...p.paper, ...patch } } : p)),
    });
  };
  const addPage = () => {
    const np = {
      id: uid(),
      paper: { texture: 'plain', tone: (page.paper?.tone + 1) % 5 || 0 },
      items: [{ id: uid(), type: 'tape', x: 32, y: 3, w: 36, rot: 2, z: 2, props: { pattern: 'stripes', color: 0 } }],
    };
    commit({ ...entry, pages: [...entry.pages, np] });
    setPi(entry.pages.length);
    setSheet(null);
    sound.page();
  };
  const removePage = () => {
    if (entry.pages.length < 2) return;
    sound.scrunch();
    commit({ ...entry, pages: entry.pages.filter((_, i) => i !== pi) });
    setPi(Math.max(0, pi - 1));
    setSheet(null);
  };
  const setStyle = (style) => {
    if (style === entry.style) return setSheet(null);
    sound.page();
    commit({ ...entry, style });
    setSheet(null);
    track('style_switched', { style });
  };

  // keyboard (desktop)
  useEffect(() => {
    const onKey = (e) => {
      if (editing || sheet) return;
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
        return;
      }
      if (!selected) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        remove();
      }
      const step = e.shiftKey ? 5 : 1;
      const nudge = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
      if (nudge) {
        e.preventDefault();
        commit(patchItem(entry, selected.id, { x: selected.x + nudge[0], y: selected.y + nudge[1] }));
      }
      if (e.key === 'Escape') setSel(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const tools = [
    { id: 'stick', label: 'Stick', Icon: Sticker },
    { id: 'tape', label: 'Tape', Icon: Scissors },
    { id: 'write', label: 'Write', Icon: PenLine },
    { id: 'photo', label: 'Photo', Icon: ImagePlus },
    { id: 'paper', label: 'Paper', Icon: StickyNote },
    { id: 'style', label: 'Style', Icon: Palette },
  ];
  const onTool = (id) => {
    sound.tap();
    if (id === 'write') {
      const it = addItem('note', { text: 'write something…', font: 'hand' }, 46);
      openEdit(it);
      setEditing({ id: it.id, type: 'note', text: '', font: 'hand' });
    } else if (id === 'photo') {
      const empty = selected?.type === 'photo' ? selected : null;
      pickPhoto(empty);
    } else setSheet(id);
  };

  return (
    <div className="screen editor">
      <header className="topbar editor-top">
        <Press variant="icon" aria-label="Back to entry" onClick={() => onDone(entryRef.current)}>
          <ArrowLeft aria-hidden="true" />
        </Press>
        <div className="editor-tabs" role="tablist" aria-label="Pages">
          {entry.pages.map((p, i) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={i === pi}
              className={i === pi ? 'is-active' : ''}
              onClick={() => {
                sound.page();
                setPi(i);
                setSel(null);
              }}
            >
              p{i + 1}
            </button>
          ))}
        </div>
        <div className="editor-top-actions">
          <Press variant="icon" aria-label="Undo" disabled={!past.current.length} onClick={undo}>
            <Undo2 aria-hidden="true" />
          </Press>
          <Press variant="icon" aria-label="Redo" disabled={!future.current.length} onClick={redo}>
            <Redo2 aria-hidden="true" />
          </Press>
          <Press
            variant="icon"
            aria-label={soundOn ? 'Mute sounds' : 'Turn sounds on'}
            aria-pressed={soundOn}
            onClick={() => setSoundOn(!soundOn)}
          >
            {soundOn ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
          </Press>
          <Press variant="primary" size="sm" sfx="page" onClick={() => onDone(entryRef.current)}>
            <Check aria-hidden="true" /> Done
          </Press>
        </div>
      </header>

      <div className="editor-body">
        <div className="editor-stage">
          <div className="editor-page" ref={pageRef}>
            <Page
              page={page}
              skin={skin}
              editable
              selectedId={sel}
              onItemPointerDown={onItemPointerDown}
              onItemDoubleTap={(it) => TEXT_TYPES.includes(it.type) && openEdit(it)}
              onPhoto={(it) => {
                if (!drag.current?.moved) pickPhoto(it);
              }}
              onBackgroundPointerDown={() => setSel(null)}
              renderSelection={(it) => (
                <>
                  <span className="sel-box" aria-hidden="true" />
                  <button
                    type="button"
                    className="sel-handle sel-rotate"
                    aria-label="Rotate"
                    onPointerDown={(e) => startDrag(e, it, 'rotate')}
                  />
                  <button
                    type="button"
                    className="sel-handle sel-scale"
                    aria-label="Resize"
                    onPointerDown={(e) => startDrag(e, it, 'scale')}
                  />
                </>
              )}
            />
          </div>
          {hint ? <div className="editor-hint">Drag to move · double-tap words to edit</div> : null}
        </div>

        <div className={`selbar ${selected ? 'is-on' : ''}`} aria-hidden={!selected}>
          {selected && TEXT_TYPES.includes(selected.type) ? (
            <Press size="sm" onClick={() => openEdit(selected)}>
              <Pencil aria-hidden="true" /> Edit
            </Press>
          ) : null}
          {selected?.type === 'photo' ? (
            <Press size="sm" onClick={() => pickPhoto(selected)}>
              <ImagePlus aria-hidden="true" /> Photo
            </Press>
          ) : null}
          <Press variant="icon" aria-label="Bring to front" onClick={forward} disabled={!selected}>
            <BringToFront aria-hidden="true" />
          </Press>
          <Press variant="icon" aria-label="Duplicate" onClick={duplicate} disabled={!selected}>
            <Copy aria-hidden="true" />
          </Press>
          <Press variant="icon" className="is-danger" aria-label="Delete" sfx={null} onClick={remove} disabled={!selected}>
            <Trash2 aria-hidden="true" />
          </Press>
        </div>

        <nav className="toolbar" aria-label="Editor tools">
          {tools.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              className={`tool ${sheet === id ? 'is-active' : ''}`}
              onClick={() => onTool(id)}
            >
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />

      <Sheet open={sheet === 'stick'} onClose={() => setSheet(null)} title="Stickers">
        <div className="tray">
          {DOODLE_KINDS.map((k) => (
            <button
              key={k}
              type="button"
              className="tray-item"
              aria-label={`${k} sticker`}
              onClick={() => addItem('doodle', { kind: k }, 16)}
            >
              <Doodle kind={k} skin={skin} />
            </button>
          ))}
        </div>
        <p className="eyebrow">bits and pieces</p>
        <div className="chip-row">
          <Chip onClick={() => openEdit(addItem('nametag', { name: 'Someone', rel: 'friend' }, 32))}>name tag</Chip>
          <Chip onClick={() => openEdit(addItem('label', { text: 'a place' }, 34))}>label</Chip>
          <Chip onClick={() => openEdit(addItem('tag', { text: 'a wish' }, 30))}>wish tag</Chip>
          <Chip onClick={() => openEdit(addItem('quote', { text: 'a line to keep' }, 50))}>quote strip</Chip>
          <Chip onClick={() => openEdit(addItem('ticket', { from: 'Here', to: 'There' }, 38))}>ticket</Chip>
          <Chip onClick={() => addItem('date', { text: dateLabel(Date.now()) }, 24)}>date stamp</Chip>
          <Chip onClick={() => addItem('mood', { mood: entry.mood }, 30)}>mood</Chip>
          <Chip onClick={() => addItem('photo', { src: null }, 40)}>photo slot</Chip>
        </div>
      </Sheet>

      <Sheet open={sheet === 'tape'} onClose={() => setSheet(null)} title="Washi tape">
        <div className="tape-tray">
          {TAPE_PATTERNS.map((pattern) =>
            [0, 1, 2, 3, 4].map((color) => (
              <button
                key={pattern + color}
                type="button"
                className="tape-swatch"
                aria-label={`${pattern} tape ${color + 1}`}
                onClick={() => addItem('tape', { pattern, color }, 30)}
              >
                <Page
                  page={{ paper: { tone: 0 }, items: [{ id: 't', type: 'tape', x: 5, y: 40, w: 90, rot: -4, props: { pattern, color } }] }}
                  skin={skin}
                  className="mini"
                />
              </button>
            )),
          )}
        </div>
      </Sheet>

      <Sheet open={sheet === 'paper'} onClose={() => setSheet(null)} title="Paper">
        <p className="eyebrow">texture</p>
        <div className="paper-row">
          {PAPER_TEXTURES.map((t) => (
            <button
              key={t}
              type="button"
              className={`paper-swatch ${page.paper.texture === t ? 'is-active' : ''}`}
              onClick={() => setPaper({ texture: t })}
            >
              <span className={`page mini skin-${skin} tex-${t}`} style={{ backgroundColor: PAPER_TONES[skin][page.paper.tone] }} />
              {t}
            </button>
          ))}
        </div>
        <p className="eyebrow">colour</p>
        <div className="paper-row">
          {PAPER_TONES[skin].map((c, i) => (
            <button
              key={c}
              type="button"
              className={`tone ${page.paper.tone === i ? 'is-active' : ''}`}
              style={{ background: c }}
              aria-label={`Paper colour ${i + 1}`}
              onClick={() => setPaper({ tone: i })}
            />
          ))}
        </div>
        <div className="cta-row">
          {entry.pages.length < 3 ? (
            <Press size="sm" sfx="page" onClick={addPage}>
              <Plus aria-hidden="true" /> Add a page
            </Press>
          ) : null}
          {entry.pages.length > 1 ? (
            <Press size="sm" variant="ghost" sfx={null} onClick={removePage}>
              <Trash2 aria-hidden="true" /> Remove this page
            </Press>
          ) : null}
        </div>
      </Sheet>

      <Sheet open={sheet === 'style'} onClose={() => setSheet(null)} title="Page style">
        <div className="style-pick">
          {[
            { id: 'pop', name: 'Pop', desc: 'bold, bright, loud' },
            { id: 'japandi', name: 'Japandi', desc: 'quiet, inky, calm' },
          ].map((s) => (
            <button
              key={s.id}
              type="button"
              className={`style-card ${entry.style === s.id ? 'is-active' : ''}`}
              onClick={() => setStyle(s.id)}
            >
              <Page page={page} skin={s.id} />
              <strong>{s.name}</strong>
              <span>{s.desc}</span>
            </button>
          ))}
        </div>
      </Sheet>

      <Sheet open={!!editing} onClose={() => setEditing(null)} title="Edit words">
        {editing ? (
          <>
            <label className="sr-only" htmlFor="edit-text">
              Text
            </label>
            <textarea
              id="edit-text"
              className="story-input small"
              autoFocus
              rows={editing.type === 'note' ? 6 : 3}
              value={editing.text}
              placeholder={editing.type === 'ticket' ? 'Delhi to Goa' : 'type here'}
              onChange={(e) => setEditing({ ...editing, text: e.target.value })}
            />
            {FONT_TYPES.includes(editing.type) ? (
              <div className="chip-row">
                {FONTS.map((f) => (
                  <Chip
                    key={f.id}
                    active={editing.font === f.id}
                    onClick={() => setEditing({ ...editing, font: editing.font === f.id ? null : f.id })}
                  >
                    <span className={`font-${f.id}`}>{f.label}</span>
                  </Chip>
                ))}
              </div>
            ) : null}
            <div className="cta-row">
              <Press variant="primary" onClick={saveEdit}>
                <Check aria-hidden="true" /> Save
              </Press>
            </div>
          </>
        ) : null}
      </Sheet>
    </div>
  );
}
