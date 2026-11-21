import { useState } from 'react';
import { Lock, MessageSquare, Trash2, Volume2, VolumeX, PlayCircle, Music } from 'lucide-react';
import { TRACKS } from '../lib/music.js';
import { Press, Confirm } from '../components/ui.jsx';
import { track } from '../lib/track.js';

// Saturday: paste the Tally form link here.
export const FEEDBACK_URL = '';
export const VERSION = 'v0.1 · round 1';

export default function You({ data, setSettings, onWipe, replayIntro }) {
  const { settings, entries } = data;
  const [confirm, setConfirm] = useState(false);
  const [name, setName] = useState(settings.name || '');

  return (
    <div className="screen you">
      <header className="page-head">
        <p className="eyebrow">{VERSION}</p>
        <h1>You</h1>
      </header>

      <section className="card">
        <label className="field">
          <span>What should your journal call you?</span>
          <input
            value={name}
            maxLength={24}
            placeholder="your name (optional)"
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setSettings({ name: name.trim() })}
          />
        </label>
      </section>

      <section className="card list">
        <button type="button" className="row" onClick={() => setSettings({ sound: !settings.sound })} aria-pressed={settings.sound}>
          {settings.sound ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
          <span>
            <strong>Crinkle sounds</strong>
            <small>paper, tape and sticker sounds</small>
          </span>
          <span className={`switch ${settings.sound ? 'is-on' : ''}`} aria-hidden="true" />
        </button>
        <button type="button" className="row" onClick={() => setSettings({ music: !settings.music })} aria-pressed={settings.music}>
          <Music aria-hidden="true" />
          <span>
            <strong>Background music</strong>
            <small>{TRACKS.length ? 'calm piano while you journal' : 'tracks arriving soon'}</small>
          </span>
          <span className={`switch ${settings.music ? 'is-on' : ''}`} aria-hidden="true" />
        </button>
        <button type="button" className="row" onClick={replayIntro}>
          <PlayCircle aria-hidden="true" />
          <span>
            <strong>Replay the intro</strong>
            <small>see how it works again</small>
          </span>
        </button>
        {FEEDBACK_URL ? (
          <a className="row" href={FEEDBACK_URL} target="_blank" rel="noreferrer" onClick={() => track('feedback_clicked')}>
            <MessageSquare aria-hidden="true" />
            <span>
              <strong>Tell me what you think</strong>
              <small>2 minutes, it really helps</small>
            </span>
          </a>
        ) : (
          <div className="row is-static">
            <MessageSquare aria-hidden="true" />
            <span>
              <strong>Feedback form</strong>
              <small>coming with the round-1 launch</small>
            </span>
          </div>
        )}
      </section>

      <section className="card privacy">
        <Lock aria-hidden="true" />
        <div>
          <strong>Your pages never leave this device.</strong>
          <p className="muted">
            No account, no cloud. Stories and photos are saved in this browser only. We count taps and screens to
            improve the app, never what you write. Clearing your browser data clears your journal.
          </p>
        </div>
      </section>

      <Press variant="danger" sfx={null} disabled={!entries.length} onClick={() => setConfirm(true)}>
        <Trash2 aria-hidden="true" /> Delete all my pages
      </Press>

      <p className="muted small center">Crinkletales is free and open source. Made by Vidushi.</p>

      <Confirm
        open={confirm}
        title={`Delete all ${entries.length} pages?`}
        body="This wipes your journal from this device. It can’t be undone."
        confirmLabel="Delete everything"
        danger
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          onWipe();
        }}
      />
    </div>
  );
}
