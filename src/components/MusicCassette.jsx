// The entry's music player. Lives outside the page, above it.
// Empty: a dashed cassette that invites you to add a song.
// Filled: a cassette showing "now playing", which plays when the entry opens.

import { useEffect, useRef, useState } from 'react';
import { Music, Play, Pause, Pencil, X, ExternalLink } from 'lucide-react';
import { Press, Sheet, Chip } from './ui.jsx';
import { TRACKS, trackById, parseSongLink, embedUrl, playTrack, bgMusic } from '../lib/music.js';
import { sound } from '../lib/sound.js';
import { track } from '../lib/track.js';

const SOURCE = { youtube: 'YouTube', spotify: 'Spotify', link: 'link', track: 'Crinkletales' };

export default function MusicCassette({ music, onChange }) {
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  // play when the entry opens; stop when it closes
  useEffect(() => {
    if (!music) return;
    bgMusic.duck();
    if (music.kind === 'track') {
      audioRef.current = playTrack(music.trackId);
      setPlaying(!!audioRef.current);
    } else if (music.kind === 'youtube') setPlaying(true);
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
      setPlaying(false);
      bgMusic.unduck();
    };
  }, [music]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      a.play().catch(() => {});
      setPlaying(true);
    } else {
      a.pause();
      setPlaying(false);
    }
  };

  const title = music?.title || (music?.kind === 'track' ? trackById(music.trackId)?.title : null) || 'a song for this day';
  const embed = embedUrl(music);

  return (
    <section className={`player ${music ? '' : 'is-empty'}`} aria-label="Music for this memory">
      {music ? (
        <div className={`cassette mini-cassette ${playing ? 'is-rec' : ''}`}>
          <div className="cassette-label">
            <Music aria-hidden="true" />
            <span className="np">
              <small>now playing</small>
              <strong>{title}</strong>
            </span>
          </div>
          <div className="cassette-row">
            <div className="cassette-reels">
              <span className="reel" />
              <span className="reel" />
            </div>
            {music.kind === 'track' ? (
              <Press variant="icon" size="sm" aria-label={playing ? 'Pause' : 'Play'} onClick={toggle}>
                {playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
              </Press>
            ) : null}
            <Press variant="icon" size="sm" aria-label="Change song" onClick={() => setOpen(true)}>
              <Pencil aria-hidden="true" />
            </Press>
          </div>
        </div>
      ) : (
        <button type="button" className="cassette-empty" onClick={() => setOpen(true)}>
          <Music aria-hidden="true" />
          <span>
            <strong>Add a song to this memory</strong>
            <small>it plays every time you open this page</small>
          </span>
        </button>
      )}

      {embed ? (
        <div className={`embed embed-${music.kind}`}>
          <iframe
            src={embed}
            title={`${title} on ${SOURCE[music.kind]}`}
            allow="autoplay; encrypted-media; clipboard-write"
            loading="lazy"
          />
        </div>
      ) : null}
      {music?.url ? (
        <a className="open-link" href={music.url} target="_blank" rel="noreferrer">
          open in {SOURCE[music.kind]} <ExternalLink aria-hidden="true" />
        </a>
      ) : null}

      <SongSheet
        open={open}
        music={music}
        onClose={() => setOpen(false)}
        onSave={(m) => {
          sound.card();
          onChange(m);
          setOpen(false);
          track('song_added', { kind: m ? m.kind : 'removed' });
        }}
      />
    </section>
  );
}

export function SongSheet({ open, music, onClose, onSave }) {
  const [link, setLink] = useState(music?.url || '');
  const [title, setTitle] = useState(music?.title || '');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (open) {
      setLink(music?.kind === 'track' ? '' : music?.url || '');
      setTitle(music?.title || '');
      setErr('');
    }
  }, [open, music]);

  const save = () => {
    const parsed = parseSongLink(link);
    if (!parsed) return setErr('Paste a YouTube or Spotify link, or pick a track below.');
    onSave({ ...parsed, title: title.trim() || null });
  };

  return (
    <Sheet open={open} onClose={onClose} title="A song for this memory">
      <label className="field">
        <span>Song name</span>
        <input value={title} placeholder="e.g. Tum Se Hi" onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label className="field">
        <span>YouTube or Spotify link</span>
        <input
          value={link}
          inputMode="url"
          placeholder="paste a link"
          onChange={(e) => {
            setLink(e.target.value);
            setErr('');
          }}
        />
      </label>
      {err ? <p className="field-error" role="alert">{err}</p> : null}
      <div className="cta-row">
        <Press variant="primary" onClick={save}>
          Save song
        </Press>
        {music ? (
          <Press variant="ghost" sfx="scrunch" onClick={() => onSave(null)}>
            <X aria-hidden="true" /> Remove
          </Press>
        ) : null}
      </div>
      <p className="eyebrow">or pick a crinkletales track</p>
      {TRACKS.length ? (
        <div className="chip-row">
          {TRACKS.map((t) => (
            <Chip
              key={t.id}
              active={music?.kind === 'track' && music.trackId === t.id}
              onClick={() => onSave({ kind: 'track', trackId: t.id, title: t.title })}
            >
              {t.title}
            </Chip>
          ))}
        </div>
      ) : (
        <p className="muted small">App tracks are coming soon.</p>
      )}
    </Sheet>
  );
}
