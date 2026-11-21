import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Mic, PenLine, Square, Shuffle, Trash2, Wand2, NotebookPen } from 'lucide-react';
import { Press, Chip } from '../components/ui.jsx';
import { detect, chipsFor, PROMPTS } from '../lib/generate.js';
import { speechSupported, startListening } from '../lib/speech.js';
import { sound } from '../lib/sound.js';
import { track } from '../lib/track.js';
import { bgMusic } from '../lib/music.js';

const MIC_MESSAGES = {
  unsupported: 'Talk mode needs Chrome, Edge or Safari. You can type instead.',
  'not-allowed': 'The mic is blocked here. Allow it in your browser, or type instead.',
  'service-not-allowed': 'The mic is blocked here. Allow it in your browser, or type instead.',
  'no-speech': 'I didn’t catch anything. Try again, a little closer to the mic.',
  'audio-capture': 'No microphone found. You can type instead.',
  network: 'Speech needs an internet connection. You can type instead.',
};

export default function Capture({ params = {}, back, onMake }) {
  const [mode, setMode] = useState(params.mode === 'talk' && speechSupported() ? 'talk' : 'type');
  const [text, setText] = useState(params.draft || '');
  const [interim, setInterim] = useState('');
  const [rec, setRec] = useState(false);
  const [secs, setSecs] = useState(0);
  const [micError, setMicError] = useState(params.mode === 'talk' && !speechSupported() ? 'unsupported' : null);
  const [prompt, setPrompt] = useState(params.prompt || PROMPTS[0]);
  const stopRef = useRef(null);
  const duckedRef = useRef(false);
  const baseRef = useRef('');
  const taRef = useRef(null);

  const d = useMemo(() => detect(text + ' ' + interim), [text, interim]);
  const chips = chipsFor(d);
  const words = d.words;
  const ready = words >= 3;

  useEffect(() => {
    if (!rec) return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [rec]);

  const release = () => {
    if (duckedRef.current) {
      duckedRef.current = false;
      bgMusic.unduck();
    }
  };
  useEffect(() => () => {
    stopRef.current?.();
    release();
  }, []);
  useEffect(() => {
    if (!rec) release();
  }, [rec]);
  useEffect(() => {
    if (mode === 'type') setTimeout(() => taRef.current?.focus(), 50);
  }, [mode]);

  const startRec = () => {
    setMicError(null);
    baseRef.current = text ? text.trim() + ' ' : '';
    setSecs(0);
    setRec(true);
    sound.tap();
    if (!duckedRef.current) {
      bgMusic.duck();
      duckedRef.current = true;
    }
    stopRef.current = startListening({
      onText: (fin, int) => {
        setText(baseRef.current + fin);
        setInterim(int);
      },
      onError: (err) => {
        if (err === 'aborted') return;
        setMicError(err);
        setRec(false);
        setInterim('');
        track('mic_error', { err });
      },
      onEnd: () => {
        setRec(false);
        setInterim('');
      },
    });
  };
  const stopRec = () => {
    stopRef.current?.();
    stopRef.current = null;
    setRec(false);
    if (interim) setText((t) => (t + ' ' + interim).trim());
    setInterim('');
  };

  const make = (skip = false) => {
    if (rec) stopRec();
    const full = (text + ' ' + interim).trim();
    track(skip ? 'page_skipped' : 'entry_made', { mode, words: full.split(/\s+/).length });
    onMake(full, mode, skip);
  };

  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');

  return (
    <div className="screen capture">
      <header className="topbar">
        <Press variant="icon" aria-label="Back" onClick={back}>
          <ArrowLeft aria-hidden="true" />
        </Press>
        <div className="seg" role="tablist" aria-label="How do you want to tell it?">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'talk'}
            className={mode === 'talk' ? 'is-active' : ''}
            onClick={() => {
              if (!speechSupported()) setMicError('unsupported');
              setMode('talk');
            }}
          >
            <Mic aria-hidden="true" /> Talk
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'type'}
            className={mode === 'type' ? 'is-active' : ''}
            onClick={() => {
              if (rec) stopRec();
              setMode('type');
            }}
          >
            <PenLine aria-hidden="true" /> Type
          </button>
        </div>
        <span style={{ width: 44 }} />
      </header>

      <button type="button" className="prompt-pill" onClick={() => setPrompt(PROMPTS[(PROMPTS.indexOf(prompt) + 1) % PROMPTS.length])}>
        <Shuffle aria-hidden="true" /> {prompt}
      </button>

      {mode === 'talk' ? (
        <div className="talk">
          <div className={`cassette big ${rec ? 'is-rec' : ''}`}>
            <div className="cassette-label">
              <span className="rec-dot" /> {rec ? `REC ${mm}:${ss}` : 'ready when you are'}
            </div>
            <div className="cassette-reels">
              <span className="reel" />
              <span className="reel" />
            </div>
          </div>
          {micError ? (
            <div className="notice" role="alert">
              <p>{MIC_MESSAGES[micError] || 'Talk mode stopped. You can try again or type instead.'}</p>
              <Press size="sm" onClick={() => setMode('type')}>
                <PenLine aria-hidden="true" /> Type instead
              </Press>
            </div>
          ) : null}
          <div className="transcript" aria-live="polite">
            {text || interim ? (
              <>
                {text} <span className="interim">{interim}</span>
                {rec ? <span className="caret" aria-hidden="true" /> : null}
              </>
            ) : (
              <span className="muted">Your words will appear here as you talk.</span>
            )}
          </div>
          <div className="talk-controls">
            <Press
              variant="icon"
              aria-label="Clear"
              sfx="scrunch"
              disabled={!text}
              onClick={() => {
                stopRec();
                setText('');
              }}
            >
              <Trash2 aria-hidden="true" />
            </Press>
            {rec ? (
              <button type="button" className="rec-btn is-rec" aria-label="Stop recording" onClick={stopRec}>
                <Square aria-hidden="true" />
              </button>
            ) : (
              <button type="button" className="rec-btn" aria-label="Start recording" onClick={startRec}>
                <Mic aria-hidden="true" />
              </button>
            )}
            <span style={{ width: 44 }} />
          </div>
        </div>
      ) : (
        <div className="type">
          <label className="sr-only" htmlFor="story">
            Your story
          </label>
          <textarea
            id="story"
            ref={taRef}
            className="story-input"
            value={text}
            placeholder="Start anywhere. “Had chai with Mom after work and it rained…”"
            onChange={(e) => setText(e.target.value)}
            rows={8}
          />
          <div className="type-meta muted">{words} words</div>
        </div>
      )}

      <div className="spotted" aria-live="polite">
        <p className="eyebrow">{chips.length ? 'spotted for your page' : 'I’ll look for places, people, food and feelings'}</p>
        <div className="chip-row">
          {chips.map((c, i) => (
            <Chip key={c.k + c.label} tone={c.k} style={{ '--i': i }}>
              <small>{c.k}</small> {c.label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="capture-foot">
        <Press variant="primary" size="lg" sfx="paper" disabled={!ready} onClick={() => make(false)}>
          <Wand2 aria-hidden="true" /> Make my page
        </Press>
        <Press variant="ghost" sfx="rustle" disabled={!ready} onClick={() => make(true)}>
          <NotebookPen aria-hidden="true" /> Skip the page, just keep my words
        </Press>
        {!ready ? <p className="muted small">Write a few words to start.</p> : null}
      </div>
    </div>
  );
}
