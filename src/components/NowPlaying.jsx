// Background music player: in the side rail on desktop, a slim strip
// above the bottom nav on phones. Hidden until tracks are added.
import { useEffect, useState } from 'react';
import { Pause, Play, SkipForward } from 'lucide-react';
import { TRACKS, bgMusic } from '../lib/music.js';
import { sound } from '../lib/sound.js';

export default function NowPlaying({ enabled }) {
  const [, tick] = useState(0);
  useEffect(() => bgMusic.subscribe(() => tick((n) => n + 1)), []);
  if (!TRACKS.length || !enabled) return null;
  const playing = bgMusic.isPlaying();
  const t = bgMusic.current();
  return (
    <div className={`now-playing ${playing ? 'is-playing' : ''}`}>
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
