// App shell: holds the journal data and decides which screen shows.
// Screens: intro, home, capture, generating, editor, entry, journal, insights, you.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Nav, Toast } from './components/ui.jsx';
import NowPlaying from './components/NowPlaying.jsx';
import { TRACKS } from './lib/music.js';
import { load, save, wipe } from './lib/storage.js';
import { setSoundEnabled, sound } from './lib/sound.js';
import { generateEntry, makeNoteEntry, pagesForNote, PROMPTS } from './lib/generate.js';
import { bgMusic } from './lib/music.js';
import { track } from './lib/track.js';
import Intro from './screens/Intro.jsx';
import Home from './screens/Home.jsx';
import Capture from './screens/Capture.jsx';
import Generating from './screens/Generating.jsx';
import Editor from './screens/Editor.jsx';
import Entry from './screens/Entry.jsx';
import Journal from './screens/Journal.jsx';
import Insights from './screens/Insights.jsx';
import You from './screens/You.jsx';

const TABS = ['home', 'journal', 'insights', 'you'];
const WITH_NAV = [...TABS, 'entry'];

export default function App() {
  const [data, setData] = useState(load);
  const [stack, setStack] = useState(() => [{ name: data.settings.introSeen ? 'home' : 'intro', params: {} }]);
  const [toast, setToast] = useState(null);
  const pending = useRef(null);
  const route = stack[stack.length - 1];

  useEffect(() => setSoundEnabled(data.settings.sound), [data.settings.sound]);
  useEffect(() => bgMusic.setEnabled(data.settings.music !== false), [data.settings.music]);
  // background music can only start after the first tap
  useEffect(() => {
    const start = () => bgMusic.play();
    window.addEventListener('pointerdown', start, { once: true });
    return () => window.removeEventListener('pointerdown', start);
  }, []);
  useEffect(() => {
    window.scrollTo(0, 0);
    track('screen_' + route.name);
  }, [route.name]);

  const notify = useCallback((text) => {
    setToast({ id: Date.now(), text });
    setTimeout(() => setToast((t) => (t && t.text === text ? null : t)), 2600);
  }, []);

  const update = useCallback(
    (fn) => {
      setData((prev) => {
        const next = fn(prev);
        if (!save(next)) notify('Storage is full or blocked. This page stays until you close the tab.');
        return next;
      });
    },
    [notify],
  );

  // ---- navigation ----
  const go = (name, params = {}) => {
    if (TABS.includes(name)) setStack([{ name, params }]);
    else setStack((s) => [...s, { name, params }]);
  };
  const replace = (name, params = {}) => setStack((s) => [...s.slice(0, -1), { name, params }]);
  const back = () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : [{ name: 'home', params: {} }]));

  // ---- data actions ----
  const setSettings = (patch) => update((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
  const saveEntry = useCallback(
    (entry) => update((d) => ({ ...d, entries: d.entries.map((e) => (e.id === entry.id ? entry : e)) })),
    [update],
  );
  const lastStyle = data.entries[0]?.style || 'pop';

  const onMake = (text, mode, skip) => {
    if (skip) {
      const note = makeNoteEntry(text, { mode, style: lastStyle });
      update((d) => ({ ...d, entries: [note, ...d.entries] }));
      track('entry_created', { theme: note.theme, pages: 0, mode });
      replace('entry', { id: note.id });
      notify('Kept as words. No page today.');
      return;
    }
    pending.current = { text, mode };
    replace('generating');
  };
  const onGenerated = useCallback(() => {
    const p = pending.current;
    if (!p) return replace('home');
    const entry = generateEntry(p.text, { mode: p.mode, style: lastStyle });
    pending.current = null;
    update((d) => ({ ...d, entries: [entry, ...d.entries] }));
    track('entry_created', { theme: entry.theme, pages: entry.pages.length, mode: entry.mode });
    replace('editor', { id: entry.id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastStyle, update]);

  const find = (id) => data.entries.find((e) => e.id === id);

  let screen;
  switch (route.name) {
    case 'intro':
      screen = (
        <Intro
          onDone={() => {
            setSettings({ introSeen: true });
            setStack([{ name: 'home', params: {} }, { name: 'capture', params: { mode: 'type', prompt: PROMPTS[0] } }]);
          }}
        />
      );
      break;
    case 'capture':
      screen = <Capture key={stack.length} params={route.params} back={back} onMake={onMake} />;
      break;
    case 'generating':
      screen = <Generating onDone={onGenerated} />;
      break;
    case 'editor': {
      const entry = find(route.params.id);
      screen = entry ? (
        <Editor
          key={entry.id}
          entry={entry}
          onSave={saveEntry}
          soundOn={data.settings.sound}
          setSoundOn={(on) => setSettings({ sound: on })}
          onDone={() => {
            sound.page();
            replace('entry', { id: entry.id });
            notify('Tucked into your journal');
          }}
        />
      ) : null;
      break;
    }
    case 'entry':
      screen = (
        <Entry
          entry={find(route.params.id)}
          back={back}
          go={go}
          onUpdate={saveEntry}
          onMakePages={(e) => {
            saveEntry(pagesForNote(e));
            track('note_to_page');
            replace('editor', { id: e.id });
          }}
          onDelete={(id) => {
            update((d) => ({ ...d, entries: d.entries.filter((e) => e.id !== id) }));
            track('entry_deleted');
            setStack([{ name: 'journal', params: {} }]);
            notify('Page thrown away');
          }}
        />
      );
      break;
    case 'journal':
      screen = <Journal data={data} go={go} />;
      break;
    case 'insights':
      screen = <Insights data={data} go={go} />;
      break;
    case 'you':
      screen = (
        <You
          data={data}
          setSettings={setSettings}
          replayIntro={() => setStack([{ name: 'intro', params: {} }])}
          onWipe={() => {
            wipe();
            update((d) => ({ ...d, entries: [] }));
            track('data_wiped');
            notify('Journal cleared');
          }}
        />
      );
      break;
    default:
      screen = <Home data={data} go={go} />;
  }
  if (!screen) screen = <Home data={data} go={go} />;

  const showNav = WITH_NAV.includes(route.name);
  const showPlayer = showNav && TRACKS.length > 0 && data.settings.music !== false;
  const navCurrent = route.name === 'entry' ? 'journal' : route.name;

  return (
    <div className={`app route-${route.name} ${showNav ? 'has-nav' : ''} ${showPlayer ? 'has-player' : ''}`}>
      {showNav ? <Nav current={navCurrent} go={go} /> : null}
      {showPlayer ? <NowPlaying enabled /> : null}
      <main className="main">{screen}</main>
      <Toast toast={toast} />
    </div>
  );
}
