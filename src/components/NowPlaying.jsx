// Background music player.
// Desktop: always in the side rail.
// Phone: the strip slides in briefly when music starts or changes, then
// tucks into a small cassette button (top right). Tap it to bring the
// controls back; they tuck away again a few seconds after the last touch.
import { useEffect, useRef, useState } from 'react';
import { Pause, Play, SkipForward } from 'lucide-react';
import { TRACKS, bgMusic } from '../lib/music.js';
import { sound } from '../lib/sound.js';

const PEEK_MS = 4500;

function useIsPhone() {
  const q = '(max-width: 899px)';
  const [phone, setPhone] = useState(() => window.matchMedia?.(q).matches ?? true);
  useEffect(() => {
    const m = window.matchMedia?.(q);
    if (!m) return;
    const on = () => setPhone(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return phone;
}

export default function NowPlaying({ enabled }) {
  const [, tick] = useState(0);
  const phone = useIsPhone();
  const [open, setOpen] = useState(false);
  const timer = useRef(null);
  const playing = bgMusic.isPlaying();
  const t = bgMusic.current();

  const peek = () => {
    setOpen(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), PEEK_MS);
  };

  useEffect(() => bgMusic.subscribe(() => tick((n) => n + 1)), []);
  useEffect(() => () => clearTimeout(timer.current), []);
  // peek when music starts or the track changes
  const trackId = t?.id;
  useEffect(() => {
    if (phone && playing) peek();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone, playing, trackId]);

  if (!TRACKS.length || !enabled) return null;

  if (phone && !open) {
    return (
      <button
        type="button"
        className={`np-mini ${playing ? 'is-playing' : ''}`}
        aria-label={`Music: ${t?.title}${playing ? ', playing' : ', paused'}. Show controls`}
        onPointerDown={() => sound.tap()}
        onClick={peek}
      >
        <span className="reel" aria-hidden="true" />
      </button>
    );
  }

  return (
    <div className={`now-playing ${playing ? 'is-playing' : ''}`} onPointerDown={phone ? peek : undefined}>
      <div className="np-reels" aria-hidden="true">
        <span className="reel" />
        <span className="reel" />
      </div>
      <div className="np-text">
        <small>{playing ? 'now playing' : 'paused'}</small>
        <strong>{t?.title}</strong>
      </div>
      <button
        type="button"
        className="np-btn is-main"
        aria-label={playing ? 'Pause music' : 'Play music'}
        onPointerDown={() => sound.tap()}
        onClick={() => bgMusic.toggle()}
      >
        {playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
      </button>
      <button type="button" className="np-btn" aria-label="Next track" onPointerDown={() => sound.tap()} onClick={() => bgMusic.next()}>
        <SkipForward aria-hidden="true" />
      </button>
    </div>
  );
}
